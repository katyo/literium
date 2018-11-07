/*!

## Dummy users backend implementation

This module provides dummy implementation of users backend for examples and tests.

*/

use super::{
    method::create_password, HasPasswordHash, HasUserAuth, HasUserData, HasUserInfo,
    HasUserSession, IsUserData, SessionData, SessionId, UserId,
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

/// Users backend
#[derive(Clone)]
pub struct Users {
    users: Arc<RwLock<Vec<UserData>>>,
    sessions: Arc<RwLock<Vec<UserSession>>>,
}

impl IsBackend for Users {
    type Error = DummyError;
}

impl Users {
    /// Create users backend
    pub fn new() -> Self {
        Self {
            users: Arc::new(RwLock::new(Vec::new())),
            sessions: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Add user
    pub fn with_user(self, user: UserData) -> Self {
        self.users.write().unwrap().push(user);
        self
    }

    /// Add session
    pub fn with_session(self, session: UserSession) -> Self {
        self.sessions.write().unwrap().push(session);
        self
    }
}

impl HasUserSession for Users {
    type SessionData = UserSession;

    fn find_user_session(
        &self,
        user: UserId,
        ctime: TimeStamp,
    ) -> BoxFuture<Option<Self::SessionData>, Self::Error> {
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
    ) -> BoxFuture<Option<Self::SessionData>, Self::Error> {
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
        mut session: Self::SessionData,
    ) -> BoxFuture<Self::SessionData, Self::Error> {
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

impl HasUserData for Users {
    type UserData = UserData;

    fn find_user_data<'a, S: Into<Cow<'a, str>>>(
        &self,
        name: S,
    ) -> BoxFuture<Option<Self::UserData>, Self::Error> {
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

    fn get_user_data(&self, user: UserId) -> BoxFuture<Option<Self::UserData>, Self::Error> {
        Box::new(result(
            self.users
                .read()
                .map(|users| users.iter().find(|data| data.id == user).map(Clone::clone))
                .map_err(|_| DummyError),
        ))
    }

    fn put_user_data(&self, mut user: Self::UserData) -> BoxFuture<Self::UserData, Self::Error> {
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

pub struct UserAuth {
    pub user: UserId,
    pub sess: SessionId,
    pub name: String,
}

impl HasUserAuth for Users {
    type AuthData = UserAuth;

    fn get_auth_data(&self, session: &Self::SessionData, user: &Self::UserData) -> Self::AuthData {
        UserAuth {
            user: user.id,
            sess: session.sess,
            name: user.name.clone(),
        }
    }
}

/// User info type
#[derive(Serialize, Deserialize)]
pub struct UserInfo {
    /// User name
    pub name: String,
}

impl HasUserInfo for Users {
    type UserInfo = UserInfo;

    fn get_user_info(&self, data: &Self::UserData) -> BoxFuture<Self::UserInfo, Self::Error> {
        Box::new(result(Ok(UserInfo {
            name: data.name.clone(),
        })))
    }
}
