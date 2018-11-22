use http::StatusCode;
use std::error::Error;
use std::fmt::{Debug, Display, Formatter, Result as FmtResult};
use warp::{reply::with_status, Rejection, Reply};

/// Basic resource error
#[derive(Debug, Clone, Copy)]
pub enum ResourceError {
    /// Backend error
    Backend,
    /// Bad request
    Stupid,
    /// Permanently missing
    Missing,
}

impl ResourceError {
    /// Convert error into reply
    pub fn recover(error: Rejection) -> Result<impl Reply, Rejection> {
        if let Some(error) = &error.find_cause::<ResourceError>() {
            use self::ResourceError::*;
            let code = match error {
                Backend => StatusCode::INTERNAL_SERVER_ERROR,
                Stupid => StatusCode::BAD_REQUEST,
                Missing => StatusCode::NOT_FOUND,
            };
            return Ok(with_status(error.to_string(), code));
        }
        Err(error)
    }
}

impl Error for ResourceError {}

impl Display for ResourceError {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::ResourceError::*;
        match self {
            Backend => f.write_str("Backend error"),
            Stupid => f.write_str("Bad request"),
            Missing => f.write_str("Not found"),
        }
    }
}

/// Either of two errors
#[derive(Debug, Clone, Copy)]
pub enum EitherError<A, B> {
    A(A),
    B(B),
}

impl<A, B> Error for EitherError<A, B>
where
    A: Debug + Display,
    B: Debug + Display,
{
}

impl<A, B> Display for EitherError<A, B>
where
    A: Display,
    B: Display,
{
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::EitherError::*;
        match self {
            A(error) => error.fmt(f),
            B(error) => error.fmt(f),
        }
    }
}

/// Dummy error for use as error type
#[derive(Debug)]
pub struct DummyError;

impl Error for DummyError {}

impl Display for DummyError {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        f.write_str("Dummy error")
    }
}
