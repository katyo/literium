/*!

## Dummy users backend implementation

This module provides dummy implementation of user data storage backend for examples and tests.

*/

use dummy::DummyError;
use futures::future::result;
use std::borrow::Cow;
use std::sync::{Arc, RwLock};
use user::{create_password, HasPasswordHash, IsUserAccess, IsUserData, UserId};
use {BoxFuture, IsBackend};

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
    fn get_password_hash(&self) -> Option<&[u8]> {
        self.hash.as_ref().map(AsRef::as_ref)
    }

    fn set_password_hash<S: AsRef<[u8]>>(&mut self, new: Option<S>) {
        self.hash = new.map(|s| Vec::from(s.as_ref()));
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

impl IsUserAccess for Users {
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
