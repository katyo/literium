use super::ReplyStreamError;
use crypto::{CanEncrypt, HasPublicKey};
use futures::Stream;
use http::StatusCode;
use httplib::Response;
use hyper::Body;
use serde::Serialize;
use serde_json::to_string;
use std::error::Error;
use std::fmt::{Display, Formatter, Result as FmtResult, Write};
use std::time::Duration;
use warp::Reply;

const MIME_TYPE: &str = "text/event-stream";

/** Server event type

You should use [`From`] or [`Into`] to create server events.

 */
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ServerEvent<N, I, T> {
    event: Option<N>,
    id: Option<I>,
    retry: Option<Duration>,
    data: T,
}

impl<T> From<T> for ServerEvent<(), (), T> {
    fn from(data: T) -> Self {
        ServerEvent {
            event: None,
            id: None,
            retry: None,
            data,
        }
    }
}

impl<N, I, T> ServerEvent<N, I, T> {
    /// Add event name
    pub fn with_name<K>(self, name: K) -> ServerEvent<K, I, T> {
        ServerEvent {
            event: Some(name),
            id: self.id,
            retry: self.retry,
            data: self.data,
        }
    }

    /// Add event id
    pub fn with_id<X>(self, id: X) -> ServerEvent<N, X, T> {
        ServerEvent {
            event: self.event,
            id: Some(id),
            retry: self.retry,
            data: self.data,
        }
    }

    /// Add reply timeout
    pub fn with_retry(self, retry: Duration) -> Self {
        ServerEvent {
            event: self.event,
            id: self.id,
            retry: Some(retry),
            data: self.data,
        }
    }
}

impl<N, I, T> Display for ServerEvent<N, I, T>
where
    N: Display,
    I: Display,
    T: Display,
{
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        // format event name if known
        if let Some(name) = &self.event {
            f.write_str("event: ")?;
            name.fmt(f)?;
            f.write_char('\n')?;
        }

        // format retry timeout if present
        if let Some(time) = self.retry {
            f.write_str("retry: ")?;

            let secs = time.as_secs();
            let millis = time.subsec_millis();

            if secs > 0 {
                // format seconds
                Display::fmt(&secs, f)?;

                // pad milliseconds
                if millis < 10 {
                    f.write_str("00")?;
                } else if millis < 100 {
                    f.write_char('0')?;
                }
            }

            // format milliseconds
            Display::fmt(&millis, f)?;

            f.write_char('\n')?;
        }

        // format data lines
        for line in self.data.to_string().split('\n') {
            f.write_str("data: ")?;
            Display::fmt(&line, f)?;
            f.write_char('\n')?;
        }

        // format id if assigned
        if let Some(id) = &self.id {
            f.write_str("id: ")?;
            id.fmt(f)?;
            f.write_char('\n')?;
        }

        // format event feed
        f.write_char('\n')
    }
}

/** Server-sent events reply

This function converts stream of server events into reply.

```
extern crate futures;
extern crate warp;
extern crate literium;

use std::time::Duration;
use futures::stream::iter_ok;
use warp::{get2, path, test::request, Filter};
use literium::{
    base::DummyError,
    reply::{ServerEvent, sse},
};

fn main() {
    let app = get2().and(path("sse")).map(|| {
        let events = iter_ok::<_, DummyError>(vec![
            ServerEvent::from("some message")
                .with_id(12)
                .with_name("chat"),
            ServerEvent::from("other message\nwith next line")
                .with_id(13)
                .with_name("chat")
                .with_retry(Duration::from_millis(3020)),
        ]);
        sse(events)
    });

    let res = request().method("GET").path("/sse").reply(&app).into_body();

    assert_eq!(
        res,
        r#"event: chat
data: some message
id: 12

event: chat
retry: 3020
data: other message
data: with next line
id: 13

"#
    );
}
```
 */
pub fn sse<N, I, T, S, E>(stream: S) -> impl Reply
where
    N: Display,
    I: Display,
    T: Display,
    S: Stream<Item = ServerEvent<N, I, T>, Error = E> + Send + 'static,
    E: Error + Send + Sync + 'static,
{
    Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", MIME_TYPE)
        .body(Body::wrap_stream(stream.map(|event| event.to_string())))
        .unwrap()
}

/** Server-sent events reply for JSON data

This function converts stream of server events into reply.

The event data represented as JSON so you should provide `Serialize` trait impl for it.

```
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate futures;
extern crate warp;
extern crate literium;

use std::time::Duration;
use futures::stream::iter_ok;
use warp::{get2, path, test::request, Filter};
use literium::{
    base::DummyError,
    reply::{ServerEvent, sse_json},
};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
struct ChatMsg {
    text: String,
    time: u32,
}

fn main() {
    let app = get2().and(path("sse")).map(|| {
        let events = iter_ok::<_, DummyError>(vec![
            ServerEvent::from(ChatMsg { text: "some message".into(), time: 1234567890 })
                .with_id(45)
                .with_name("chat"),
            ServerEvent::from(ChatMsg { text: "next message".into(), time: 1234569708 })
                .with_id(47)
                .with_name("chat")
                .with_retry(Duration::from_millis(5)),
        ]);
        sse_json(events)
    });

    let res = request().method("GET").path("/sse").reply(&app).into_body();

    assert_eq!(
        res,
        r#"event: chat
data: {"text":"some message","time":1234567890}
id: 45

event: chat
retry: 5
data: {"text":"next message","time":1234569708}
id: 47

"#
    );
}
```

 */
pub fn sse_json<N, I, T, S, E>(stream: S) -> impl Reply
where
    N: Display + Send + 'static,
    I: Display + Send + 'static,
    T: Serialize,
    S: Stream<Item = ServerEvent<N, I, T>, Error = E> + Send + 'static,
    E: Error + Send + Sync + 'static,
{
    sse(stream
        .map_err(ReplyStreamError::StreamError)
        .and_then(|event| {
            to_string(&event.data)
                .map_err(ReplyStreamError::CodingError)
                .map(|data| ServerEvent {
                    id: event.id,
                    event: event.event,
                    retry: event.retry,
                    data,
                })
        }))
}

/** Server-sent events reply for BASE64 encoded sealed JSON data

This function converts stream of server events into reply.

The event data represented as JSON so you should provide `Serialize` trait impl for it.

 */
pub fn sse_x_json<N, I, T, S, E, K>(stream: S, state: K) -> impl Reply
where
    N: Display + Send + 'static,
    I: Display + Send + 'static,
    T: Serialize,
    S: Stream<Item = ServerEvent<N, I, T>, Error = E> + Send + 'static,
    E: Error + Send + Sync + 'static,
    K: HasPublicKey + Send + Sync + 'static,
{
    sse(stream
        .map_err(ReplyStreamError::StreamError)
        .and_then(move |event| {
            (state.as_ref() as &K::PublicKey)
                .seal_json_b64(&event.data)
                .map_err(ReplyStreamError::CodingError)
                .map(|data| ServerEvent {
                    id: event.id,
                    event: event.event,
                    retry: event.retry,
                    data,
                })
        }))
}
