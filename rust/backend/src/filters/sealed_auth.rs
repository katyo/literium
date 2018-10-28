use futures::{
    future::{err, Either},
    Future,
};
use http::StatusCode;
use std::error::Error;
use std::fmt::{Display, Formatter, Result as FmtResult};

use auth::{AuthData, SessionData, SessionId, UserId};
use crypto::{decrypt_base64_sealed_json, HasPublicKey, HasSecretKey};
use warp::{any, header, reject::custom, reply, Filter, Rejection, Reply};

/// Authentication error
#[derive(Debug, Clone, Copy)]
pub enum AuthError {
    BackendError,
    InvalidSession,
    InvalidUser,
    LostSession,
}

impl Error for AuthError {}

impl Display for AuthError {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::AuthError::*;
        match self {
            BackendError => f.write_str("Backend error"),
            InvalidSession => f.write_str("Invalid session"),
            InvalidUser => f.write_str("Invalid user"),
            LostSession => f.write_str("Lost session"),
        }
    }
}

pub fn auth_recover(error: Rejection) -> Result<impl Reply, Rejection> {
    if let Some(&error) = error.find_cause::<AuthError>() {
        use self::AuthError::*;
        let code = match error {
            BackendError => StatusCode::INTERNAL_SERVER_ERROR,
            InvalidSession => StatusCode::FORBIDDEN,
            InvalidUser => StatusCode::BAD_REQUEST,
            LostSession => StatusCode::FORBIDDEN,
        };
        Ok(reply::with_status(error.to_string(), code))
    } else {
        Err(error)
    }
}

/// Access to user sessions
pub trait HasUserSession {
    /// Extra data type
    type ExtraData;

    /// Create new user session with default data
    fn new_user_session() -> SessionData<Self::ExtraData>;

    /// Get user session data by identifier
    fn get_user_session(
        &self,
        user: UserId,
        session: SessionId,
    ) -> Box<Future<Item = Option<SessionData<Self::ExtraData>>, Error = ()> + Send>;

    /// Save modified user session data
    fn put_user_session(
        &self,
        session: SessionData<Self::ExtraData>,
    ) -> Box<Future<Item = (), Error = ()> + Send>;
}

/// Access to users
pub trait HasUserData {
    /// User data type
    type UserData: Send;

    /// Get user data by id
    fn get_user_data(
        &self,
        user: UserId,
    ) -> Box<Future<Item = Option<Self::UserData>, Error = ()> + Send>;
}

/// Get user identification from header
///
/// Requests should contain base64 encoded sealed JSON auth data in `X-Auth` header.
///
/// This function extracts auth data, checks session and returns user data which can be used to check permissions and etc.
pub fn base64_sealed_auth<U, K, ExtraData>(
    keys: K,
    users: U,
) -> impl Filter<Extract = (U::UserData,), Error = Rejection> + Clone
where
    U: HasUserSession<ExtraData = ExtraData> + HasUserData + Send + Sync + Clone,
    K: HasPublicKey + HasSecretKey + Send + Clone,
{
    let keys = any().map(move || keys.clone());
    let users = any().map(move || users.clone());

    any()
        .and(header("x-auth"))
        .and(keys)
        .and_then(|data: String, keys| decrypt_base64_sealed_json(data, keys))
        .and(users.clone())
        .and_then(|data: AuthData, users: U| {
            users
                .clone()
                .get_user_session(data.user, data.session)
                .map_err(|_| AuthError::BackendError)
                .and_then(move |session: Option<SessionData<ExtraData>>| {
                    let mut session = if let Some(session) = session {
                        session
                    } else {
                        return Either::A(err(AuthError::InvalidSession));
                    };
                    //if !session.valid(Duration::from_secs(5 * 24 * 60 * 60)) {
                    //
                    //}
                    if data != session {
                        return Either::A(err(AuthError::LostSession));
                    }
                    session.renew();
                    Either::B(
                        users
                            .put_user_session(session)
                            .map(|_| data)
                            .map_err(|_| AuthError::BackendError),
                    )
                }).map_err(custom)
        }).and(users)
        .and_then(|data: AuthData, users: U| {
            users
                .get_user_data(data.user)
                .map_err(|_| AuthError::BackendError)
                .and_then(|user| user.ok_or_else(|| AuthError::InvalidUser))
                .map_err(custom)
        })
}

#[cfg(test)]
mod test {
    use super::*;
    use warp::test;

    use std::marker::PhantomData;

    type UserSession = SessionData<PhantomData<()>>;

    #[test]
    fn sealed_auth() {}
}
