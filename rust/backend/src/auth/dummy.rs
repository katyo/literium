/*!

## Dummy sessions backend implementation

This module provides dummy implementation of session storage backend for examples and tests.

*/

use super::{
    HasSessionAccess, IsSessionAccess, IsSessionData, IsUserAuth, IsUserInfo, SessionData,
    SessionId,
};
use base::{dummy::DummyError, BoxFuture, IsBackend, TimeStamp};
use futures::future::result;
use std::sync::{Arc, RwLock};
use user::{HasUserAccess, IsUserAccess, IsUserData, UserId};

pub type UserSession = SessionData;

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

impl IsSessionAccess for Sessions {
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
        session: &<<S as HasSessionAccess>::SessionAccess as IsSessionAccess>::Session,
        user: &<<S as HasUserAccess>::UserAccess as IsUserAccess>::User,
    ) -> Self {
        UserAuth {
            user: user.get_user_id(),
            sess: session.session_data().sess,
            name: user.get_user_name().into(),
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
        user: &<<S as HasUserAccess>::UserAccess as IsUserAccess>::User,
    ) -> BoxFuture<Self, <<S as HasUserAccess>::UserAccess as IsBackend>::Error> {
        Box::new(result(Ok(UserInfo {
            name: user.get_user_name().into(),
        })))
    }
}
