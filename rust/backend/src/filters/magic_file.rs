use base::EitherError;
use bytes::{Buf, BufMut, Bytes, BytesMut};
use futures::{Async, Poll, Stream};
use http::{HttpChunk, StatusCode};
use magic;
use mime::Mime;
use serde_with::rust::seq_display_fromstr;
use std::collections::HashSet;
use std::error::Error;
use std::fmt::{Display, Formatter, Result as FmtResult};
use std::mem::replace;
use std::path::PathBuf;
use std::sync::Arc;
use warp::{
    body::{stream as stream_body, BodyStream},
    header,
    reject::custom,
    reply::with_status,
    Error as WarpError, Filter, Rejection, Reply,
};

/// Magic file error
#[derive(Debug, Clone, Copy)]
pub enum MagicError {
    MagicFail,
    BadMime,
    MissingType,
    MissingSize,
    SizeNotEnough,
    SizeExcessive,
    BadMagic,
    MismatchType,
}

impl MagicError {
    /// Convert image error into reply
    pub fn recover(error: Rejection) -> Result<impl Reply, Rejection> {
        if let Some(error) = &error.find_cause::<MagicError>() {
            let code = match error {
                MagicError::MagicFail | MagicError::BadMime => StatusCode::INTERNAL_SERVER_ERROR,
                _ => StatusCode::BAD_REQUEST,
            };
            return Ok(with_status(error.to_string(), code));
        }
        Err(error)
    }
}

impl Error for MagicError {}

impl Display for MagicError {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::MagicError::*;
        f.write_str(match self {
            MagicFail => "Magic error",
            BadMime => "Invalid mime type",
            MissingType => "No content type",
            MissingSize => "No content length",
            SizeNotEnough => "Size not enough",
            SizeExcessive => "Size excessive",
            BadMagic => "Invalid file data",
            MismatchType => "Mismatch type",
        })
    }
}

impl From<magic::MagicError> for MagicError {
    fn from(error: magic::MagicError) -> Self {
        error!("Magic error: {}", error);
        MagicError::MagicFail
    }
}

impl From<mime::FromStrError> for MagicError {
    fn from(error: mime::FromStrError) -> Self {
        error!("Mime error: {}", error);
        MagicError::BadMime
    }
}

/// Mime detector interface
pub trait IsMimeDetector {
    fn detect<B: AsRef<[u8]>>(&self, data: B) -> Result<Mime, MagicError>;
}

/// State which has mime detector
pub trait HasMimeDetector
where
    Self: AsRef<<Self as HasMimeDetector>::MimeDetector>,
{
    type MimeDetector: IsMimeDetector + Sync;
}

/// The magic file options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MagicOptions {
    /// Allowed file mime types
    #[serde(default = "default_file_types")]
    #[serde(with = "seq_display_fromstr")]
    pub file_types: HashSet<Mime>,

    /// Minimum allowed file size
    #[serde(default = "default_min_size")]
    pub min_size: usize,
    /// Maximum allowed file size
    #[serde(default = "default_max_size")]
    pub max_size: usize,
}

fn default_file_types() -> HashSet<Mime> {
    vec![].into_iter().collect()
}

fn default_min_size() -> usize {
    1
}

fn default_max_size() -> usize {
    2500000 // 2.5Mbytes
}

impl Default for MagicOptions {
    fn default() -> Self {
        MagicOptions {
            file_types: default_file_types(),
            min_size: default_min_size(),
            max_size: default_max_size(),
        }
    }
}

/// Magic detector config
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MagicConfig {
    #[serde(default = "default_magic_dbs")]
    magic_dbs: Vec<PathBuf>,
}

fn default_magic_dbs() -> Vec<PathBuf> {
    vec!["/usr/share/misc/magic.mgc".into()]
}

/// Magic detector
#[derive(Clone)]
pub struct MagicDetector(Arc<magic::Cookie>);

impl MagicDetector {
    pub fn new(config: &MagicConfig) -> Result<Self, MagicError> {
        let cookie = magic::Cookie::open(magic::flags::MIME_TYPE)?;
        cookie.load(&config.magic_dbs)?;
        Ok(MagicDetector(Arc::new(cookie)))
    }
}

impl IsMimeDetector for MagicDetector {
    fn detect<B: AsRef<[u8]>>(&self, data: B) -> Result<Mime, MagicError> {
        self.0
            .buffer(data.as_ref())
            .map_err(MagicError::from)
            .and_then(|res| res.parse().map_err(MagicError::from))
    }
}

/** Check file body and return data stream

The `Content-Type` header should be one of allowed mime-types.
Also `Content-Length` header is required.

 */
pub fn magic<S, O>(
    state: &S,
    opts: &O,
) -> impl Filter<Extract = (MagicStream<S, O>,), Error = Rejection> + Clone
where
    S: HasMimeDetector + Send + Clone,
    O: AsRef<MagicOptions> + Send + Clone,
{
    let state = state.clone();
    let opts = opts.clone();
    header("content-type")
        .or_else(|_| Err(custom(MagicError::MissingType)))
        .and(header("content-length").or_else(|_| Err(custom(MagicError::MissingSize))))
        .and(stream_body())
        .and_then(move |mime: Mime, size: usize, stream| {
            {
                let opts = opts.as_ref();

                if !opts.file_types.iter().any(|t| t == &mime) {
                    return Err(custom(MagicError::BadMime));
                }

                if size < opts.min_size {
                    return Err(custom(MagicError::SizeNotEnough));
                }

                if size > opts.max_size {
                    return Err(custom(MagicError::SizeExcessive));
                }
            }

            Ok(MagicStream {
                stream: Some(stream),
                mime,
                det_type: false,
                buffered: None,
                opts: opts.clone(),
                state: state.clone(),
            })
        })
}

/// The stream which check magic data
pub struct MagicStream<S, O> {
    stream: Option<BodyStream>,
    mime: Mime,
    det_type: bool,
    buffered: Option<BytesMut>,
    opts: O,
    state: S,
}

impl<S, O> Stream for MagicStream<S, O>
where
    S: HasMimeDetector,
    O: AsRef<MagicOptions> + Send,
{
    type Item = HttpChunk;
    type Error = EitherError<WarpError, MagicError>;

    fn poll(&mut self) -> Poll<Option<Self::Item>, Self::Error> {
        let res = if let Some(stream) = &mut self.stream {
            stream.poll()
        } else {
            return Ok(Async::Ready(None));
        };

        match res {
            Ok(Async::NotReady) => Ok(Async::NotReady),
            Ok(Async::Ready(None)) => {
                self.stream = None;
                self.buffered = None;
                Ok(Async::Ready(None))
            }
            Ok(Async::Ready(Some(chunk))) => {
                if self.det_type {
                    Ok(Async::Ready(Some(HttpChunk::from(Bytes::from(
                        chunk.bytes(),
                    )))))
                } else {
                    let mut error = None;
                    {
                        if self.buffered.is_none() {
                            self.buffered = Some(BytesMut::from(chunk.bytes()));
                        } else {
                            if let Some(bytes) = &mut self.buffered {
                                bytes.put_slice(chunk.bytes());
                            }
                        }
                        let bytes = self.buffered.as_ref().unwrap();

                        match self.state.as_ref().detect(&bytes[..]) {
                            Ok(mime) => if self.opts.as_ref().file_types.contains(&mime) {
                                // type detected
                                self.det_type = true;
                                if self.mime != mime {
                                    warn!(
                                        "Detected mime is: {}, but declared is: {}",
                                        mime, self.mime
                                    );
                                }
                            } else {
                                error = Some(MagicError::BadMime);
                            },
                            Err(e) => error = Some(e),
                        }
                    }
                    if let Some(e) = error {
                        self.stream = None;
                        self.buffered = None;
                        Err(EitherError::B(e))
                    } else if !self.det_type {
                        Ok(Async::NotReady)
                    } else {
                        let bytes = replace(&mut self.buffered, None);
                        Ok(Async::Ready(bytes.map(|bytes| bytes.freeze().into())))
                    }
                }
            }
            Err(e) => Err(EitherError::A(e)),
        }
    }
}
