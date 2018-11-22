use base::TimeStamp;
use bytes::{Buf, Bytes};
use futures::{
    future::{ok, poll_fn, Either},
    Future, Sink, Stream,
};
use http::HttpBody;
use httplib::{Response, StatusCode};
use std::error::Error;
use std::path::{Path, PathBuf};
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc,
};
use tokio::{
    codec::{BytesCodec, FramedWrite},
    fs::{create_dir_all, read_dir, remove_file, rename, File},
    timer::Interval,
};
use warp::{reject::custom, Rejection};

/// Temporary files options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TempFilesOptions {
    /// Base directory to store
    ///
    /// The base directory to store temporary files.
    #[serde(default = "default_base_path")]
    pub base_path: PathBuf,
    /// Life time in milliseconds
    ///
    /// Temporary files will be deleted after this interval.
    #[serde(default = "default_life_time")]
    pub life_time: TimeStamp,
    /// Poll time in milliseconds
    ///
    /// Temporary files will be checked each poll time.
    #[serde(default = "default_poll_time")]
    pub poll_time: TimeStamp,
}

fn default_base_path() -> PathBuf {
    "tmp".into()
}

fn default_life_time() -> TimeStamp {
    TimeStamp::default().with_hours(12)
}

fn default_poll_time() -> TimeStamp {
    TimeStamp::default().with_mins(15)
}

impl Default for TempFilesOptions {
    fn default() -> Self {
        TempFilesOptions {
            base_path: default_base_path(),
            life_time: default_life_time(),
            poll_time: default_poll_time(),
        }
    }
}

/** Temporary files storage

The temporary file storage aimed to save uploaded files (images and attachments).

Because it cannot be served through WEB directly, first it should be saved in permanent file storage.

Store stream as temporary file:

```
extern crate http;
extern crate tokio;
extern crate warp;
extern crate literium;

use http::StatusCode;
use warp::{post2, path, body::stream, test::request, Filter};
use literium::file::{TempFiles, TempFilesOptions};
use std::fs::remove_dir_all;

fn main() {
    let options = TempFilesOptions::default();
    let storage = TempFiles::new(options.clone());

    let app = post2()
        .and(path("upload"))
        .and(stream())
        .and_then(move |body| {
            storage.store_and_reply(body)
        });

    let res = request()
        .method("POST")
        .path("/upload")
        .body("Not so large file contents")
        .reply(&app);

    assert_eq!(res.status(), StatusCode::CREATED);
    assert_eq!(res.headers().contains_key("X-File"), true);

    remove_dir_all(options.base_path);
}
```
 */
#[derive(Clone)]
pub struct TempFiles {
    config: Arc<TempFilesOptions>,
    prevts: Arc<AtomicUsize>,
}

impl TempFiles {
    /// Create new temporary files storage
    pub fn new(config: TempFilesOptions) -> Self {
        TempFiles {
            config: Arc::new(config),
            prevts: Arc::new(AtomicUsize::new(0)),
        }
    }

    /// Run poll task
    ///
    /// This task periodically checks temporary files and delete too old.
    pub fn run(&self) -> impl Future<Item = (), Error = ()> + Send + 'static {
        let config = self.config.clone();
        Interval::new_interval(config.poll_time.into())
            .map_err(|error| {
                error!("Timer error: {}", error);
            }).for_each(move |_| {
                let curr_time = TimeStamp::now();
                let life_time = config.life_time;
                read_dir(config.base_path.clone())
                    .map_err(|error| {
                        error!("Unable to read directory: {}", error);
                    }).and_then(move |dir| {
                        dir.map_err(|error| {
                            error!("Unable to get directory entry: {}", error);
                        }).for_each(move |entry| {
                            let path = entry.path();
                            poll_fn(move || entry.poll_metadata())
                                .map_err(|error| {
                                    error!("Unable to poll entry metadata: {}", error);
                                }).and_then(move |meta| {
                                    if meta.is_file() {
                                        if let Ok(ctime) = meta.modified().or(meta.created()) {
                                            let ctime = TimeStamp::from(ctime);
                                            if curr_time - ctime > life_time {
                                                return Either::A(remove_file(path).map_err(
                                                    |error| {
                                                        error!("Unable to remove file: {}", error);
                                                    },
                                                ));
                                            }
                                        }
                                    }
                                    Either::B(ok(()))
                                })
                        })
                    })
            })
    }

    /// Store stream as temporary file
    ///
    /// The result is a name of temporary file.
    pub fn store<S>(
        &self,
        stream: S,
    ) -> impl Future<Item = String, Error = Rejection> + Send + 'static
    where
        S: Stream + Send + 'static,
        S::Item: Buf,
        S::Error: Error + Send + Sync + 'static,
    {
        let name = self.temp_name();
        let path = self.temp_path(&name);

        create_dir_all(self.config.base_path.clone())
            .and_then(move |_| File::create(path))
            .map_err(custom)
            .and_then(|file| {
                stream
                    .map(|buf| Bytes::from(buf.bytes()))
                    .map_err(custom)
                    .forward(FramedWrite::new(file, BytesCodec::new()).sink_map_err(custom))
            }).map(move |_| name)
    }

    /// Store stream as temporary file and reply
    pub fn store_and_reply<S>(
        &self,
        stream: S,
    ) -> impl Future<Item = Response<HttpBody>, Error = Rejection> + Send + 'static
    where
        S: Stream + Send + 'static,
        S::Item: Buf,
        S::Error: Error + Send + Sync + 'static,
    {
        self.store(stream).map(|name| {
            Response::builder()
                .status(StatusCode::CREATED)
                .header("X-File", name)
                .body(HttpBody::empty())
                .unwrap()
        })
    }

    /// Makes temporary file to be permanent
    ///
    /// Since it just renames file so temporary directory and destination path should be in the same file system.
    pub fn permanent<N, P>(
        &self,
        name: &N,
        path: P,
    ) -> impl Future<Item = (), Error = Rejection> + Send + 'static
    where
        N: AsRef<str>,
        P: AsRef<Path> + Send + 'static,
    {
        let from = self.temp_path(name.as_ref());
        if let Some(dir) = path.as_ref().parent() {
            Either::A(create_dir_all(dir.to_path_buf()))
        } else {
            Either::B(ok(()))
        }.and_then(move |_| rename(from, path))
        .map_err(|error| {
            error!("Unable to rename file: {}", error);
            custom(error)
        })
    }

    /// Make temporary path using temporary name
    fn temp_path(&self, name: &str) -> PathBuf {
        let mut path = self.config.base_path.clone();
        path.push(&name);
        path
    }

    /// Make temporary name as current timestamp in milliseconds
    fn temp_name(&self) -> String {
        let mut ts: u64 = TimeStamp::now().into();

        // preventing conflicts of temporary file names
        if ts as usize == self.prevts.load(Ordering::Acquire) {
            ts += 1;
        }
        self.prevts.store(ts as usize, Ordering::Release);

        ts.to_string()
    }
}
