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
pub trait HasUserSession: IsBackend {
    /// Session data type
    type SessionData: IsSessionData + Send;

    /// Create new user session
    fn new_user_session(
        &self,
        user: UserId,
        pbkey: PublicKey,
    ) -> BoxFuture<Self::SessionData, Self::Error>
    where
        Self::SessionData: From<SessionData>,
    {
        self.put_user_session(Self::SessionData::from(SessionData::new(user, pbkey)))
    }

    /// Find user session by user id and creation time
    fn find_user_session(
        &self,
        user: UserId,
        ctime: TimeStamp,
    ) -> BoxFuture<Option<Self::SessionData>, Self::Error>;

    /// Get user session data by identifier
    fn get_user_session(
        &self,
        user: UserId,
        session: SessionId,
    ) -> BoxFuture<Option<Self::SessionData>, Self::Error>;

    /// Save modified user session data
    fn put_user_session(
        &self,
        session: Self::SessionData,
    ) -> BoxFuture<Self::SessionData, Self::Error>;
}

/// Get user auth from session and user data
pub trait HasUserAuth: HasUserSession + HasUserData {
    /// Auth data type
    type AuthData;

    /// Get auth data
    fn get_auth_data(&self, session: &Self::SessionData, user: &Self::UserData) -> Self::AuthData;
}

/// Basic user data
pub trait IsUserData {
    fn user_id(&self) -> UserId;
    fn user_name(&self) -> &str;
}

/// User data which has password
pub trait HasPasswordHash {
    type PasswordHash: AsRef<[u8]>;

    fn get_password_hash(&self) -> Option<&Self::PasswordHash>;
    fn set_password_hash<S: AsRef<[u8]>>(&mut self, new: Option<S>);
}

/// Access to user data
pub trait HasUserData: IsBackend {
    /// User data type
    type UserData: IsUserData + Send;

    /// Get user data by name
    fn find_user_data<'a, S: Into<Cow<'a, str>>>(
        &self,
        name: S,
    ) -> BoxFuture<Option<Self::UserData>, Self::Error>;

    /// Get user data by id
    fn get_user_data(&self, user: UserId) -> BoxFuture<Option<Self::UserData>, Self::Error>;

    /// Save user data
    fn put_user_data(&self, user: Self::UserData) -> BoxFuture<Self::UserData, Self::Error>;
}

/// Get info from from user data
pub trait HasUserInfo: HasUserData + HasUserSession {
    type UserInfo;

    fn get_user_info(&self, user: &Self::UserData) -> BoxFuture<Self::UserInfo, Self::Error>;
}
