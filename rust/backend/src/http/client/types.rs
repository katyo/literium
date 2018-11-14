use httplib::Error as HttpError;
use hyper::Error as HyperError;
use serde_qs::Error as QueryError;
use std::error::Error;
use std::fmt::{Debug, Display, Formatter, Result as FmtResult};

/// HTTP client error
#[derive(Debug)]
pub enum HttpClientError<E, D> {
    Http(HttpError),
    Hyper(HyperError),
    Query(QueryError),
    Encode(E),
    Decode(D),
    Missing,
}

impl<E, D> Error for HttpClientError<E, D>
where
    E: Debug + Display,
    D: Debug + Display,
{
}

impl<E, D> Display for HttpClientError<E, D>
where
    E: Display,
    D: Display,
{
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::HttpClientError::*;
        match self {
            Http(error) => write!(f, "Http error: {}", error),
            Hyper(error) => write!(f, "Hyper error: {}", error),
            Query(error) => write!(f, "Query encoding error: {}", error),
            Encode(error) => write!(f, "Body encoding error: {}", error),
            Decode(error) => write!(f, "Body decoding error: {}", error),
            Missing => f.write_str("Missing response body"),
        }
    }
}
