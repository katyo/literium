use http::StatusCode;
use std::error::Error;
use std::fmt::{Display, Formatter, Result as FmtResult};
use warp::{reply::with_status, Rejection, Reply};

/// Authentication error
#[derive(Debug, Clone, Copy)]
pub enum AuthError {
    /// Application backend error
    BackendError,
    /// Third service error
    ServiceError,
    /// Missing auth header
    MissingAuth,
    /// Bad auth data
    BadAuth,
    /// Lost session
    LostSession,
    /// Invalid session
    BadSession,
    /// Invalid user
    BadUser,
    /// Auth data or session outdated
    Outdated,
    /// Invalid auth method
    BadMethod,
    /// Invalid third service
    BadService,
    /// Invalid indetification data
    BadIdent,
    /// Need retry authorization
    NeedRetry,
    /// Restricted access
    Restricted,
}

impl AuthError {
    /// Convert auth error into reply
    pub fn recover(error: Rejection) -> Result<impl Reply, Rejection> {
        if let Some(error) = &error.find_cause::<AuthError>() {
            use self::AuthError::*;
            let code = match error {
                BackendError | ServiceError => StatusCode::INTERNAL_SERVER_ERROR,
                BadMethod | BadService => StatusCode::BAD_REQUEST,
                BadSession | BadUser | LostSession | Outdated | BadIdent | MissingAuth
                | BadAuth | Restricted => StatusCode::FORBIDDEN,
                NeedRetry => StatusCode::CREATED,
            };
            return Ok(with_status(error.to_string(), code));
        }
        Err(error)
    }
}

impl Error for AuthError {}

impl Display for AuthError {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::AuthError::*;
        match self {
            BackendError => f.write_str("Backend error"),
            ServiceError => f.write_str("Service error"),
            MissingAuth => f.write_str("Missing auth"),
            BadAuth => f.write_str("Bad auth data"),
            LostSession => f.write_str("Lost session"),
            BadSession => f.write_str("Bad session"),
            BadUser => f.write_str("Bad user"),
            Outdated => f.write_str("Outdated info"),
            BadMethod => f.write_str("Bad auth method"),
            BadService => f.write_str("Bad auth service"),
            BadIdent => f.write_str("Bad user ident"),
            NeedRetry => f.write_str("Retry auth"),
            Restricted => f.write_str("Restricted access"),
        }
    }
}
