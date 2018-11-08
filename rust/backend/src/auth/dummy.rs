/*!

## Dummy users backend implementation

This module provides dummy implementation of users backend for examples and tests.

*/

use super::{
    create_password, HasPasswordHash, HasSessionAccess, HasUserAccess, IsSessionData, IsUserAuth,
    IsUserData, IsUserInfo, SessionAccess, SessionData, SessionId, UserAccess, UserId,
};
use futures::future::result;
use std::borrow::Cow;
use std::error::Error;
use std::fmt;
use std::sync::{Arc, RwLock};
use {BoxFuture, IsBackend, TimeStamp};

pub type UserSession = SessionData;

/// User data type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserData {
    /// Unique identifier of user
    pub id: UserId,

    /// User name
    pub name: String,

    /// Password hash
    pub hash: Option<Vec<u8>>,
}

impl UserData {
    /// Create new user
    pub fn new<S: Into<String>>(id: UserId, name: S) -> Self {
        Self {
            id,
            name: name.into(),
            hash: None,
        }
    }

    /// Set user password
    pub fn with_password<S: AsRef<str>>(mut self, new: S) -> Self {
        self.hash = Some(create_password(new));
        self
    }
}

impl IsUserData for UserData {
    fn user_id(&self) -> UserId {
        self.id
    }

    fn user_name(&self) -> &str {
        &self.name
    }

    fn from_name<'a, S: Into<Cow<'a, str>>>(name: S) -> Self {
        UserData::new(0, name.into())
    }
}

impl HasPasswordHash for UserData {
    type PasswordHash = Vec<u8>;

    fn get_password_hash(&self) -> Option<&Self::PasswordHash> {
        if let Some(hash) = &self.hash {
            Some(hash)
        } else {
            None
        }
    }

    fn set_password_hash<S: AsRef<[u8]>>(&mut self, new: Option<S>) {
        self.hash = new.map(|s| Vec::from(s.as_ref()));
    }
}

#[derive(Debug)]
pub struct DummyError;

impl Error for DummyError {}

impl fmt::Display for DummyError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        f.write_str("Dummy error")
    }
}

/// Dummy users backend
#[derive(Clone)]
pub struct Users {
    users: Arc<RwLock<Vec<UserData>>>,
}

impl IsBackend for Users {
    type Error = DummyError;
}

impl Users {
    /// Create users backend
    pub fn new() -> Self {
        Self {
            users: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Add user
    pub fn with_user(self, user: UserData) -> Self {
        self.users.write().unwrap().push(user);
        self
    }
}

impl UserAccess for Users {
    type User = UserData;

    fn find_user_data<'a, S: Into<Cow<'a, str>>>(
        &self,
        name: S,
    ) -> BoxFuture<Option<Self::User>, Self::Error> {
        let name = name.into();
        Box::new(result(
            self.users
                .read()
                .map(|users| {
                    users
                        .iter()
                        .find(|data| data.name == name)
                        .map(Clone::clone)
                }).map_err(|_| DummyError),
        ))
    }

    fn get_user_data(&self, user: UserId) -> BoxFuture<Option<Self::User>, Self::Error> {
        Box::new(result(
            self.users
                .read()
                .map(|users| users.iter().find(|data| data.id == user).map(Clone::clone))
                .map_err(|_| DummyError),
        ))
    }

    fn put_user_data(&self, mut user: Self::User) -> BoxFuture<Self::User, Self::Error> {
        Box::new(result(
            self.users
                .write()
                .map(|mut users| {
                    if let Some(index) = users.iter().position(|data| data.id == user.id) {
                        users[index] = user.clone();
                    } else {
                        user.id = users.len() as u32 + 1;
                        users.push(user.clone());
                    }
                    user
                }).map_err(|_| DummyError),
        ))
    }
}

/// Dummy sessions backend
#[derive(Clone)]
pub struct Sessions {
    sessions: Arc<RwLock<Vec<UserSession>>>,
}

impl Sessions {
    /// Create sessions backend
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Add session
    pub fn with_session(self, session: UserSession) -> Self {
        self.sessions.write().unwrap().push(session);
        self
    }
}

impl IsBackend for Sessions {
    type Error = DummyError;
}

impl SessionAccess for Sessions {
    type Session = UserSession;

    fn find_user_session(
        &self,
        user: UserId,
        ctime: TimeStamp,
    ) -> BoxFuture<Option<Self::Session>, Self::Error> {
        Box::new(result(
            self.sessions
                .read()
                .map(|sessions| {
                    sessions
                        .iter()
                        .find(|session| session.user == user && session.ctime == ctime)
                        .cloned()
                }).map_err(|_| DummyError),
        ))
    }

    fn get_user_session(
        &self,
        user: UserId,
        sess: SessionId,
    ) -> BoxFuture<Option<Self::Session>, Self::Error> {
        Box::new(result(
            self.sessions
                .read()
                .map(|sessions| {
                    sessions
                        .iter()
                        .find(|data| data.user == user && data.sess == sess)
                        .map(Clone::clone)
                }).map_err(|_| DummyError),
        ))
    }

    fn put_user_session(
        &self,
        mut session: Self::Session,
    ) -> BoxFuture<Self::Session, Self::Error> {
        Box::new(result(
            self.sessions
                .write()
                .map(|mut sessions| {
                    if let Some(index) = sessions
                        .iter()
                        .position(|data| data.user == session.user && data.sess == session.sess)
                    {
                        sessions[index] = session.clone();
                    } else {
                        session.sess = sessions.len() as u32 + 1;
                        sessions.push(session.clone());
                    }
                    session
                }).map_err(|_| DummyError),
        ))
    }
}

pub struct UserAuth {
    pub user: UserId,
    pub sess: SessionId,
    pub name: String,
}

impl<S> IsUserAuth<S> for UserAuth
where
    S: HasSessionAccess + HasUserAccess,
{
    fn new_user_auth(
        session: &<<S as HasSessionAccess>::SessionAccess as SessionAccess>::Session,
        user: &<<S as HasUserAccess>::UserAccess as UserAccess>::User,
    ) -> Self {
        UserAuth {
            user: user.user_id(),
            sess: session.session_data().sess,
            name: user.user_name().into(),
        }
    }
}

/// User info type
#[derive(Serialize, Deserialize)]
pub struct UserInfo {
    /// User name
    pub name: String,
}

impl<S> IsUserInfo<S> for UserInfo
where
    S: HasUserAccess,
{
    fn new_user_info(
        _state: &S,
        user: &<<S as HasUserAccess>::UserAccess as UserAccess>::User,
    ) -> BoxFuture<Self, <<S as HasUserAccess>::UserAccess as IsBackend>::Error> {
        Box::new(result(Ok(UserInfo {
            name: user.user_name().into(),
        })))
    }
}
