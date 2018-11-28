/*!

## Dummy sessions backend implementation

This module provides dummy implementation of session storage backend for examples and tests.

*/

use super::{
    BaseSessionData, HasSessionStorage, IsSessionData, IsSessionStorage, IsUserAuth, SessionArg,
    SessionId,
};
use access::{Grant, HasAccess};
use base::{BoxFuture, DummyError, IsBackend, TimeStamp};
use futures::future::result;
use std::sync::{Arc, RwLock};
use user::{HasUserStorage, IsUserData, IsUserStorage, UserArg, UserId};

pub type SessionData = BaseSessionData;

impl From<(SessionData, ())> for SessionData {
    fn from((session, _): (SessionData, ())) -> Self {
        session
    }
}

/// Dummy sessions backend
#[derive(Clone)]
pub struct Sessions {
    sessions: Arc<RwLock<Vec<SessionData>>>,
}

impl Sessions {
    /// Create sessions backend
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Add session
    pub fn with_session(self, session: SessionData) -> Self {
        self.sessions.write().unwrap().push(session);
        self
    }
}

impl IsBackend for Sessions {
    type Error = DummyError;
}

impl IsSessionStorage for Sessions {
    type Session = SessionData;

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

    fn del_user_session(
        &self,
        user: UserId,
        session: SessionId,
    ) -> BoxFuture<Option<()>, Self::Error> {
        Box::new(result(
            self.sessions
                .write()
                .map(|mut sessions| {
                    if let Some(index) = sessions
                        .iter()
                        .position(|data| data.user == user && data.sess == session)
                    {
                        sessions.swap_remove(index);
                        Some(())
                    } else {
                        None
                    }
                }).map_err(|_| DummyError),
        ))
    }

    fn get_user_sessions(&self, user: UserId) -> BoxFuture<Vec<Self::Session>, Self::Error> {
        Box::new(result(
            self.sessions
                .read()
                .map(|sessions| {
                    sessions
                        .iter()
                        .filter(|session| session.user == user)
                        .cloned()
                        .collect()
                }).map_err(|_| DummyError),
        ))
    }

    fn del_user_sessions(&self, user: UserId) -> BoxFuture<(), Self::Error> {
        Box::new(result(
            self.sessions
                .write()
                .map(|mut sessions| sessions.retain(|data| data.user != user))
                .map_err(|_| DummyError),
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
    S: HasSessionStorage + HasUserStorage,
{
    fn new_user_auth(
        session: &<<S as HasSessionStorage>::SessionStorage as IsSessionStorage>::Session,
        user: &<<S as HasUserStorage>::UserStorage as IsUserStorage>::User,
    ) -> Self {
        UserAuth {
            user: user.get_user_id(),
            sess: session.session_data().sess,
            name: user.get_user_name().into(),
        }
    }

    fn new_none_auth() -> Option<Self> {
        Some(UserAuth {
            user: 0,
            sess: 0,
            name: "guest".into(),
        })
    }
}

impl HasAccess<SessionArg, Grant> for UserAuth {
    fn has_access(&self, grant: &Grant) -> bool {
        match grant {
            // Only unauthorized user can authorize
            Grant::Create => self.user == 0,
            _ => false,
        }
    }

    fn has_access_to(&self, session: &SessionArg, grant: &Grant) -> bool {
        match grant {
            // Only owner can read and drop sessions
            Grant::Read | Grant::Delete => self.user == session.user,
            _ => false,
        }
    }
}

impl HasAccess<UserArg, Grant> for UserAuth {
    fn has_access_to(&self, user: &UserArg, grant: &Grant) -> bool {
        match grant {
            Grant::Read | Grant::Update => self.user == user.user,
            _ => false,
        }
    }
}
