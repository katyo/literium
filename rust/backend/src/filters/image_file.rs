use base::EitherError;
use bytes::{Buf, BufMut, Bytes, BytesMut};
use futures::{Async, Poll, Stream};
use http::{HttpChunk, StatusCode};
use imagesize;
use mime::{Mime, BMP, GIF, IMAGE, JPEG, PNG};
use std::error::Error;
use std::fmt::{Display, Formatter, Result as FmtResult};
use std::io::ErrorKind;
use std::mem::replace;
use warp::{
    body::{stream as stream_body, BodyStream},
    header,
    reject::custom,
    reply::with_status,
    Error as WarpError, Filter, Rejection, Reply,
};

/// Image file error
#[derive(Debug, Clone, Copy)]
pub enum ImageError {
    MissingType,
    MissingSize,
    NotAnImage,
    BadImageType,
    BadImageData,
    WidthNotEnough,
    WidthExcessive,
    HeightNotEnough,
    HeightExcessive,
    PixelsNotEnough,
    PixelsExcessive,
    SizeNotEnough,
    SizeExcessive,
}

impl ImageError {
    /// Convert image error into reply
    pub fn recover(error: Rejection) -> Result<impl Reply, Rejection> {
        if let Some(error) = &error.find_cause::<ImageError>() {
            let code = StatusCode::BAD_REQUEST;
            return Ok(with_status(error.to_string(), code));
        }
        Err(error)
    }
}

impl Error for ImageError {}

impl Display for ImageError {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::ImageError::*;
        f.write_str(match self {
            MissingType => "No content type",
            MissingSize => "No content length",
            NotAnImage => "Not an image",
            BadImageType => "Bad image type",
            BadImageData => "Bad image data",
            WidthNotEnough => "Width not enough",
            WidthExcessive => "Width excessive",
            HeightNotEnough => "Height not enough",
            HeightExcessive => "Height excessive",
            PixelsNotEnough => "Pixels not enough",
            PixelsExcessive => "Pixels excessive",
            SizeNotEnough => "Size not enough",
            SizeExcessive => "Size excessive",
        })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum ImageType {
    #[serde(rename = "png")]
    Png,
    #[serde(rename = "jpeg")]
    Jpeg,
    #[serde(rename = "webp")]
    Webp,
    #[serde(rename = "gif")]
    Gif,
    #[serde(rename = "bmp")]
    Bmp,
}

impl ImageType {
    pub fn from_mime(mime: &Mime) -> Option<ImageType> {
        if mime.type_() != IMAGE {
            use self::ImageType::*;
            Some(if mime.subtype() == "webp" {
                Webp
            } else {
                match mime.subtype() {
                    PNG => Png,
                    JPEG => Jpeg,
                    GIF => Gif,
                    BMP => Bmp,
                    _ => return None,
                }
            })
        } else {
            None
        }
    }
}

impl From<imagesize::ImageType> for ImageType {
    fn from(t: imagesize::ImageType) -> Self {
        use imagesize::ImageType::*;
        match t {
            Png => ImageType::Png,
            Jpeg => ImageType::Jpeg,
            Webp => ImageType::Webp,
            Gif => ImageType::Gif,
            Bmp => ImageType::Bmp,
        }
    }
}

/// The image file options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageOptions {
    /// Allowed image mime types
    #[serde(default = "default_file_types")]
    pub file_types: Vec<ImageType>,

    /// Minimum allowed width of image
    #[serde(default = "default_min_width")]
    pub min_width: usize,
    /// Maximum allowed width of image
    #[serde(default = "default_max_width")]
    pub max_width: usize,

    /// Minimum allowed height of image
    #[serde(default = "default_min_height")]
    pub min_height: usize,
    /// Maximum allowed height of image
    #[serde(default = "default_max_height")]
    pub max_height: usize,

    /// Minimum allowed number of pixels
    ///
    /// The minimum value of width*height.
    #[serde(default = "default_min_pixels")]
    pub min_pixels: usize,
    /// Maximum allowed number of pixels
    ///
    /// The maximum value of width*height.
    #[serde(default = "default_max_pixels")]
    pub max_pixels: usize,

    /// Minimum image file size
    #[serde(default = "default_min_size")]
    pub min_size: usize,
    /// Maximum image file size
    #[serde(default = "default_max_size")]
    pub max_size: usize,
}

fn default_file_types() -> Vec<ImageType> {
    vec![ImageType::Png, ImageType::Jpeg, ImageType::Gif]
}

impl ImageOptions {
    fn check_dimensions(&self, width: usize, height: usize) -> Option<ImageError> {
        use self::ImageError::*;
        if width < self.min_width {
            return Some(WidthNotEnough);
        }
        if width > self.max_width {
            return Some(WidthExcessive);
        }

        if height < self.min_height {
            return Some(HeightNotEnough);
        }
        if height > self.max_height {
            return Some(HeightExcessive);
        }

        let pixels = width * height;
        if pixels < self.min_pixels {
            return Some(PixelsNotEnough);
        }
        if pixels > self.max_pixels {
            return Some(PixelsExcessive);
        }
        None
    }
}

fn default_min_width() -> usize {
    1
}

fn default_max_width() -> usize {
    2000 // 2KPix
}

fn default_min_height() -> usize {
    1
}

fn default_max_height() -> usize {
    2000 // 2KPix
}

fn default_min_pixels() -> usize {
    1
}

fn default_max_pixels() -> usize {
    4000000 // 4MPix
}

fn default_min_size() -> usize {
    1
}

fn default_max_size() -> usize {
    2500000 // 2.5Mbytes
}

impl Default for ImageOptions {
    fn default() -> Self {
        ImageOptions {
            file_types: default_file_types(),
            min_width: default_min_width(),
            max_width: default_max_width(),
            min_height: default_min_height(),
            max_height: default_max_height(),
            min_pixels: default_min_pixels(),
            max_pixels: default_max_pixels(),
            min_size: default_min_size(),
            max_size: default_max_size(),
        }
    }
}

/** Check image body and return data stream

The `Content-Type` header should be one of allowed mime-types.
Also `Content-Length` header is required.

 */
pub fn image<S>(state: &S) -> impl Filter<Extract = (ImageStream<S>,), Error = Rejection> + Clone
where
    S: AsRef<ImageOptions> + Send + Clone,
{
    let state = state.clone();
    header("content-type")
        .or_else(|_| Err(custom(ImageError::MissingType)))
        .and(header("content-length").or_else(|_| Err(custom(ImageError::MissingSize))))
        .and(stream_body())
        .and_then(move |mime: Mime, size: usize, stream| {
            let opts = state.as_ref();
            let type_ =
                ImageType::from_mime(&mime).ok_or_else(|| custom(ImageError::NotAnImage))?;

            if !opts.file_types.iter().any(|t| t == &type_) {
                return Err(custom(ImageError::BadImageType));
            }

            if size < opts.min_size {
                return Err(custom(ImageError::SizeNotEnough));
            }

            if size > opts.max_size {
                return Err(custom(ImageError::SizeExcessive));
            }

            Ok(ImageStream {
                stream: Some(stream),
                type_,
                det_type: false,
                det_size: false,
                buffered: None,
                state: state.clone(),
            })
        })
}

/// The stream which check image data
pub struct ImageStream<S> {
    stream: Option<BodyStream>,
    type_: ImageType,
    det_type: bool,
    det_size: bool,
    buffered: Option<BytesMut>,
    state: S,
}

impl<S> Stream for ImageStream<S>
where
    S: AsRef<ImageOptions>,
{
    type Item = HttpChunk;
    type Error = EitherError<WarpError, ImageError>;

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
                if self.det_type && self.det_size {
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

                        if !self.det_type {
                            match imagesize::image_type(&bytes[..]) {
                                Ok(type_) => if self.type_ == ImageType::from(type_) {
                                    // type detected
                                    self.det_type = true;
                                } else {
                                    error = Some(ImageError::BadImageType);
                                },
                                Err(e) => match e {
                                    imagesize::ImageError::NotSupported(_) => {
                                        error = Some(ImageError::NotAnImage);
                                    }
                                    imagesize::ImageError::CorruptedImage(_) => {
                                        error = Some(ImageError::BadImageData);
                                    }
                                    imagesize::ImageError::IoError(e) => {
                                        if e.kind() != ErrorKind::UnexpectedEof {
                                            error = Some(ImageError::BadImageData);
                                        }
                                    }
                                },
                            }
                        }
                        if !self.det_size {
                            match imagesize::blob_size(&bytes[..]) {
                                Ok(size) => if let Some(e) = self
                                    .state
                                    .as_ref()
                                    .check_dimensions(size.width, size.height)
                                {
                                    error = Some(e);
                                } else {
                                    // size detected
                                    self.det_size = true;
                                },
                                Err(e) => match e {
                                    imagesize::ImageError::NotSupported(_) => {
                                        error = Some(ImageError::NotAnImage);
                                    }
                                    imagesize::ImageError::CorruptedImage(_) => {
                                        error = Some(ImageError::BadImageData);
                                    }
                                    imagesize::ImageError::IoError(e) => {
                                        if e.kind() != ErrorKind::UnexpectedEof {
                                            error = Some(ImageError::BadImageData);
                                        }
                                    }
                                },
                            }
                        }
                    }
                    if let Some(e) = error {
                        self.stream = None;
                        self.buffered = None;
                        Err(EitherError::B(e))
                    } else if !self.det_type || !self.det_size {
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
