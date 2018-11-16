use super::ReplyStreamError;
use futures::{Async, Poll, Stream};
use http::StatusCode;
use httplib::Response;
use hyper::{Body, Chunk};
use serde::Serialize;
use serde_json::{to_string, Error as JsonError};
use std::error::Error;
use std::fmt::Display;
use std::mem::replace;
use warp::Reply;

const MIME_TYPE: &str = "application/json";

/** Reply with streamed JSON array body

This function converts stream of serializable values into reply with JSON array.

`Content-Type` header will be set to "application/json".

```
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate futures;
extern crate warp;
extern crate literium;

use futures::stream::iter_ok;
use warp::{Filter, get2, path, any, test::request};
use literium::{reply, base::dummy::DummyError};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
struct MyData {
    field: String,
}

fn main() {
    let app = get2()
        .and(path("data"))
        // reply with encrypted body
        .map(|| reply::s_json_seq(iter_ok::<_, DummyError>(vec![
            MyData { field: "abc".into() },
            MyData { field: "def".into() },
        ])));

    let res = request()
        .method("GET")
        .path("/data/stream")
        .reply(&app)
        .into_body();

    assert_eq!(res, r#"[{"field":"abc"},{"field":"def"}]"#);
}
```

 */
pub fn s_json_seq<T, E, S>(stream: S) -> impl Reply
where
    T: Serialize,
    S: Stream<Item = T, Error = E> + Send + 'static,
    E: Error + Send + Sync + 'static,
{
    Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", MIME_TYPE)
        .body(Body::wrap_stream(JsonArrayStream::from(stream)))
        .unwrap()
}

/** Reply with streamed JSON object body

This function converts stream of serializable key-value pairs into reply with JSON object.

`Content-Type` header will be set to "application/json".

```
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate futures;
extern crate warp;
extern crate literium;

use futures::stream::iter_ok;
use warp::{Filter, get2, path, any, test::request};
use literium::{reply, base::dummy::DummyError};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
struct MyData {
    field: String,
}

fn main() {
    let app = get2()
        .and(path("data"))
        // reply with encrypted body
        .map(|| reply::s_json_map(iter_ok::<_, DummyError>(vec![
            ("foo", MyData { field: "abc".into() }),
            ("bar", MyData { field: "def".into() }),
        ])));

    let res = request()
        .method("GET")
        .path("/data/stream")
        .reply(&app)
        .into_body();

    assert_eq!(res, r#"{"foo":{"field":"abc"},"bar":{"field":"def"}}"#);
}
```

 */
pub fn s_json_map<N, T, E, S>(stream: S) -> impl Reply
where
    N: Display,
    T: Serialize,
    S: Stream<Item = (N, T), Error = E> + Send + 'static,
    E: Error + Send + Sync + 'static,
{
    Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", MIME_TYPE)
        .body(Body::wrap_stream(JsonObjectStream::from(stream)))
        .unwrap()
}

#[derive(PartialEq)]
enum StreamState {
    Initial,
    Started,
    Stopped,
}

/// The stream of values represented as JSON array
pub struct JsonArrayStream<S> {
    stream: S,
    state: StreamState,
    chunk: Option<Chunk>,
}

impl<S> From<S> for JsonArrayStream<S> {
    fn from(stream: S) -> Self {
        JsonArrayStream {
            stream,
            state: StreamState::Initial,
            chunk: None,
        }
    }
}

impl<S> Stream for JsonArrayStream<S>
where
    S: Stream,
    S::Item: Serialize,
{
    type Item = Chunk;
    type Error = ReplyStreamError<S::Error, JsonError>;

    fn poll(&mut self) -> Poll<Option<Self::Item>, Self::Error> {
        if self.chunk.is_some() {
            let chunk = replace(&mut self.chunk, None).unwrap();
            Ok(Async::Ready(Some(chunk)))
        } else if self.state == StreamState::Stopped {
            Ok(Async::Ready(None))
        } else {
            match self.stream.poll() {
                Ok(Async::Ready(Some(data))) => match to_string(&data) {
                    Ok(data) => {
                        self.chunk = Some(data.into());
                        Ok(Async::Ready(Some(if self.state == StreamState::Initial {
                            self.state = StreamState::Started;
                            "[".into()
                        } else {
                            ",".into()
                        })))
                    }
                    Err(error) => Err(ReplyStreamError::CodingError(error)),
                },
                Ok(Async::Ready(None)) => {
                    self.state = StreamState::Stopped;
                    Ok(Async::Ready(Some("]".into())))
                }
                Ok(Async::NotReady) => Ok(Async::NotReady),
                Err(error) => Err(ReplyStreamError::StreamError(error)),
            }
        }
    }
}

/// The stream of key-value pairs represented as JSON object
pub struct JsonObjectStream<S> {
    stream: S,
    state: StreamState,
    nchunk: Option<Chunk>,
    dchunk: Option<Chunk>,
}

impl<S> From<S> for JsonObjectStream<S> {
    fn from(stream: S) -> Self {
        JsonObjectStream {
            stream,
            state: StreamState::Initial,
            nchunk: None,
            dchunk: None,
        }
    }
}

impl<S, N, T> Stream for JsonObjectStream<S>
where
    S: Stream<Item = (N, T)>,
    N: Display,
    T: Serialize,
{
    type Item = Chunk;
    type Error = ReplyStreamError<S::Error, JsonError>;

    fn poll(&mut self) -> Poll<Option<Self::Item>, Self::Error> {
        if self.nchunk.is_some() {
            let chunk = replace(&mut self.nchunk, None).unwrap();
            Ok(Async::Ready(Some(chunk)))
        } else if self.dchunk.is_some() {
            let chunk = replace(&mut self.dchunk, None).unwrap();
            Ok(Async::Ready(Some(chunk)))
        } else if self.state == StreamState::Stopped {
            Ok(Async::Ready(None))
        } else {
            match self.stream.poll() {
                Ok(Async::Ready(Some((name, data)))) => match to_string(&name.to_string())
                    .and_then(|name| to_string(&data).map(|data| (name + ":", data)))
                {
                    Ok((name, data)) => {
                        self.nchunk = Some(name.into());
                        self.dchunk = Some(data.into());
                        Ok(Async::Ready(Some(if self.state == StreamState::Initial {
                            self.state = StreamState::Started;
                            "{".into()
                        } else {
                            ",".into()
                        })))
                    }
                    Err(error) => Err(ReplyStreamError::CodingError(error)),
                },
                Ok(Async::Ready(None)) => {
                    self.state = StreamState::Stopped;
                    Ok(Async::Ready(Some("}".into())))
                }
                Ok(Async::NotReady) => Ok(Async::NotReady),
                Err(error) => Err(ReplyStreamError::StreamError(error)),
            }
        }
    }
}
