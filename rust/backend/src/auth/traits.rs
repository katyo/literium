use super::{SessionData, SessionId};
use base::{BoxFuture, IsBackend, TimeStamp};
use crypto::PublicKey;
use user::{HasUserAccess, IsUserAccess, UserId};

/// Access to session data
pub trait IsSessionData {
    /// Get immutable session data
    fn session_data(&self) -> &SessionData;

    /// Get mutable session data
    fn session_data_mut(&mut self) -> &mut SessionData;
}

impl IsSessionData for SessionData {
    fn session_data(&self) -> &SessionData {
        self
    }

    fn session_data_mut(&mut self) -> &mut SessionData {
        self
    }
}

/// Access to user sessions
pub trait IsSessionAccess: IsBackend {
    /// Session data type
    type Session: IsSessionData + Send + 'static;

    /// Create new user session
    fn new_user_session(
        &self,
        user: UserId,
        pbkey: PublicKey,
    ) -> BoxFuture<Self::Session, Self::Error>
    where
        Self::Session: From<SessionData>,
    {
        self.put_user_session(Self::Session::from(SessionData::new(user, pbkey)))
    }

    /// Find user session by user id and creation time
    fn find_user_session(
        &self,
        user: UserId,
        ctime: TimeStamp,
    ) -> BoxFuture<Option<Self::Session>, Self::Error>;

    /// Get user session data by identifier
    fn get_user_session(
        &self,
        user: UserId,
        session: SessionId,
    ) -> BoxFuture<Option<Self::Session>, Self::Error>;

    /// Save modified user session data
    fn put_user_session(&self, session: Self::Session) -> BoxFuture<Self::Session, Self::Error>;

    /// Delete user session by identifier
    fn del_user_session(
        &self,
        user: UserId,
        session: SessionId,
    ) -> BoxFuture<Option<()>, Self::Error>;

    /// Get all user sessions
    fn get_user_sessions(&self, user: UserId) -> BoxFuture<Vec<Self::Session>, Self::Error>;

    /// Drop all user sessions
    fn del_user_sessions(&self, user: UserId) -> BoxFuture<(), Self::Error>;
}

/// State has access to user sessions
pub trait HasSessionAccess
where
    Self: AsRef<<Self as HasSessionAccess>::SessionAccess>,
{
    /// User session accessor
    type SessionAccess: IsSessionAccess;
}

/// Server-side user auth data
pub trait IsUserAuth<S>
where
    Self: Send + Sized,
    S: HasSessionAccess + HasUserAccess,
{
    /// Create auth data from session and user data
    ///
    /// This should returns user auth when auth header is present and has valid auth info (i.e. in case of authorized access).
    fn new_user_auth(
        session: &<<S as HasSessionAccess>::SessionAccess as IsSessionAccess>::Session,
        user: &<<S as HasUserAccess>::UserAccess as IsUserAccess>::User,
    ) -> Self;

    /// Create auth data for unauthorized access
    ///
    /// This may returns user auth when auth header is missing (i.e. in case of unauthorized access).
    /// If this method returns `None` then `x_auth()` rejects with `FORBIDDEN` error.
    fn new_none_auth() -> Option<Self>;
}

/// State has server-side user auth data
pub trait HasUserAuth
where
    Self: HasSessionAccess + HasUserAccess + Sized,
{
    /// User auth data type
    type UserAuth: IsUserAuth<Self> + 'static;
}
