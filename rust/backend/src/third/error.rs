use std::error::Error;
use std::fmt::{Display, Formatter, Result as FmtResult};

/// Third service error
#[derive(Debug, Clone, Copy)]
pub enum ThirdError {
    /// Application backend error
    BackendError,
    /// Third service error
    ServiceError,
    /// Access token outdated and not refresh token available
    BadToken,
}

impl Error for ThirdError {}

impl Display for ThirdError {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::ThirdError::*;
        match self {
            BackendError => f.write_str("Backend error"),
            ServiceError => f.write_str("Service error"),
            BadToken => f.write_str("BadToken"),
        }
    }
}
