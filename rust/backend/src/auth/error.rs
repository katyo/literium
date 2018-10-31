use http::StatusCode;
use std::error::Error;
use std::fmt::{Display, Formatter, Result as FmtResult};
use warp::{reply::with_status, Rejection, Reply};

/// Authentication error
#[derive(Debug, Clone, Copy)]
pub enum AuthError {
    BackendError,
    LostSession,
    BadSession,
    BadUser,
    Outdated,
    BadMethod,
    BadIdent,
}

impl AuthError {
    /// Convert identification error into reply
    pub fn recover(error: Rejection) -> Result<impl Reply, Rejection> {
        if let Some(&error) = error.find_cause::<AuthError>() {
            use self::AuthError::*;
            let code = match error {
                BackendError => StatusCode::INTERNAL_SERVER_ERROR,
                BadMethod => StatusCode::BAD_REQUEST,
                BadSession | BadUser | LostSession | Outdated | BadIdent => StatusCode::FORBIDDEN,
            };
            Ok(with_status(error.to_string(), code))
        } else {
            Err(error)
        }
    }
}

impl Error for AuthError {}

impl Display for AuthError {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::AuthError::*;
        match self {
            BackendError => f.write_str("Backend error"),
            LostSession => f.write_str("Lost session"),
            BadSession => f.write_str("Bad session"),
            BadUser => f.write_str("Bad user"),
            Outdated => f.write_str("Outdated info"),
            BadMethod => f.write_str("Bad auth method"),
            BadIdent => f.write_str("Bad user ident"),
        }
    }
}
