use super::{SessionData, SessionId, UserId};
use crypto::PublicKey;
use std::borrow::Cow;
use {BoxFuture, IsBackend, TimeStamp};

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
pub trait SessionAccess: IsBackend {
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
}

/// State has access to user sessions
pub trait HasSessionAccess
where
    Self: AsRef<<Self as HasSessionAccess>::SessionAccess>,
{
    /// User session accessor
    type SessionAccess: SessionAccess;
}

/// Server-side user auth data
pub trait IsUserAuth<S>
where
    Self: Send,
    S: HasSessionAccess + HasUserAccess,
{
    /// Create auth data from session and user data
    fn new_user_auth(
        session: &<<S as HasSessionAccess>::SessionAccess as SessionAccess>::Session,
        user: &<<S as HasUserAccess>::UserAccess as UserAccess>::User,
    ) -> Self;
}

/// State has server-side user auth data
pub trait HasUserAuth
where
    Self: HasSessionAccess + HasUserAccess + Sized,
{
    /// User auth data type
    type UserAuth: IsUserAuth<Self> + Send + 'static;
}

/// Basic user data
pub trait IsUserData: Sized {
    /// Get unique user identifier
    fn user_id(&self) -> UserId;

    /// Get unique user name
    fn user_name(&self) -> &str;

    /// Create user data using unique name
    fn from_name<'a, S: Into<Cow<'a, str>>>(name: S) -> Self;
}

/// User data which has password
pub trait HasPasswordHash {
    type PasswordHash: AsRef<[u8]>;

    fn get_password_hash(&self) -> Option<&Self::PasswordHash>;
    fn set_password_hash<S: AsRef<[u8]>>(&mut self, new: Option<S>);
}

/// Access to user data
pub trait UserAccess: IsBackend {
    /// User data type
    type User: IsUserData + Send + 'static;

    /// Get user data by name
    fn find_user_data<'a, S: Into<Cow<'a, str>>>(
        &self,
        name: S,
    ) -> BoxFuture<Option<Self::User>, Self::Error>;

    /// Get user data by id
    fn get_user_data(&self, user: UserId) -> BoxFuture<Option<Self::User>, Self::Error>;

    /// Save user data
    fn put_user_data(&self, user: Self::User) -> BoxFuture<Self::User, Self::Error>;
}

/// State has access to user data
pub trait HasUserAccess
where
    Self: AsRef<<Self as HasUserAccess>::UserAccess>,
{
    /// User data accessor
    type UserAccess: UserAccess;
}

/// Client-side user info
pub trait IsUserInfo<S>
where
    S: HasUserAccess,
{
    /// Create user info from user data
    ///
    /// Also you can extract additional data using access to state.
    fn new_user_info(
        state: &S,
        user: &<<S as HasUserAccess>::UserAccess as UserAccess>::User,
    ) -> BoxFuture<Self, <<S as HasUserAccess>::UserAccess as IsBackend>::Error>;
}

/// State hash client-side auth info
pub trait HasUserInfo
where
    Self: HasUserAccess + Sized,
{
    /// User info type
    type UserInfo: IsUserInfo<Self>;
}
