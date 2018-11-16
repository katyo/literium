use futures::Stream;
use http::StatusCode;
use httplib::Response;
use hyper::Body;
use serde::Serialize;
use serde_json::to_string;
use std::error::Error;
use std::fmt::{Debug, Display, Formatter, Result as FmtResult, Write};
use std::time::Duration;
use warp::Reply;

const MIME_TYPE: &str = "text/event-stream";

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
    pub fn with_name<K>(self, name: K) -> ServerEvent<K, I, T> {
        ServerEvent {
            event: Some(name),
            id: self.id,
            retry: self.retry,
            data: self.data,
        }
    }

    pub fn with_id<X>(self, id: X) -> ServerEvent<N, X, T> {
        ServerEvent {
            event: self.event,
            id: Some(id),
            retry: self.retry,
            data: self.data,
        }
    }

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

/**

Server-sent events reply

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

/// Server stream error wrapper
///
/// This type helps avoid boxing of error values.
#[derive(Debug)]
pub enum ServerEventError<SE, CE> {
    StreamError(SE),
    CodingError(CE),
}

impl<SE, CE> Error for ServerEventError<SE, CE>
where
    SE: Debug + Display,
    CE: Debug + Display,
{}

impl<SE, CE> Display for ServerEventError<SE, CE>
where
    SE: Display,
    CE: Display,
{
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::ServerEventError::*;
        match self {
            StreamError(error) => error.fmt(f),
            CodingError(error) => error.fmt(f),
        }
    }
}

/**

Server-sent events reply for JSON data

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
        .map_err(ServerEventError::StreamError)
        .and_then(|event| {
            to_string(&event.data)
                .map_err(ServerEventError::CodingError)
                .map(|data| ServerEvent {
                    id: event.id,
                    event: event.event,
                    retry: event.retry,
                    data,
                })
        }))
}
