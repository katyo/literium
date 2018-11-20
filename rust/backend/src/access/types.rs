use http::StatusCode;
use std::error::Error;
use std::fmt::{Display, Formatter, Result as FmtResult};
use warp::{reply::with_status, Rejection, Reply};

/// Generic resource grants
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum Grant {
    /// The ability to read existing resource
    Read,
    /// The ability to create new resource
    Create,
    /// The ability to update existing resource
    Update,
    /// The ability to remove existing resource
    Delete,
    /// The ability to change special resource properties like owner, creation date and etc.
    Manage,
}

/// Access error
#[derive(Debug, Clone, Copy)]
pub enum AccessError {
    Denied,
}

impl AccessError {
    /// Convert identification error into reply
    pub fn recover(error: Rejection) -> Result<impl Reply, Rejection> {
        if let Some(&error) = error.find_cause::<AccessError>() {
            use self::AccessError::*;
            let code = match error {
                Denied => StatusCode::FORBIDDEN,
            };
            Ok(with_status(error.to_string(), code))
        } else {
            Err(error)
        }
    }
}

impl Error for AccessError {}

impl Display for AccessError {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::AccessError::*;
        match self {
            Denied => f.write_str("Access denied"),
        }
    }
}
