use auth::{AuthError, IsAuthMethod};
use futures::{
    future::{err, ok, Either},
    Future,
};
use user::{HasUserAccess, IsUserAccess, IsUserData};

use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use {BoxFuture, CanUpdateFrom, TimeStamp};

use super::{AuthInfo, AuthToken, IsOTPassIdent, IsOTPassSender, OTPassOptions, UserIdent};

type Tokens<I> = HashMap<I, AuthToken>;

struct State<P, I> {
    options: OTPassOptions,
    sender: P,
    tokens: RwLock<Tokens<I>>,
}

/// One-Time password auth method
#[derive(Clone)]
pub struct OTPassAuth<S, P>(Arc<State<P, P::UserIdent>>)
where
    P: IsOTPassSender<S>;

impl<S, P> OTPassAuth<S, P>
where
    P: IsOTPassSender<S>,
{
    /// Create one-time password auth method instance
    pub fn new(sender: P, options: OTPassOptions) -> Self {
        OTPassAuth(Arc::new(State {
            options,
            sender,
            tokens: RwLock::new(HashMap::new()),
        }))
    }

    fn clear_tokens(&self, at: TimeStamp) {
        // clear dead tokens
        let dt = at - self.0.options.dead_time;
        self.0
            .tokens
            .write()
            .unwrap()
            .retain(|_, token| token.ctime > dt);
    }

    fn create_token(&self, _state: &S, ident: &P::UserIdent) -> Option<String> {
        let at = TimeStamp::now();
        self.clear_tokens(at);

        {
            let tokens = self.0.tokens.read().unwrap();
            if tokens.contains_key(&ident) {
                return None;
            }
        }

        let mut tokens = self.0.tokens.write().unwrap();
        let token = AuthToken::new(at, &self.0.options);
        let pass = token.pass.clone();

        tokens.insert(ident.clone(), token);

        Some(pass)
    }

    fn verify_token(&self, _state: &S, ident: &P::UserIdent, pass: &String) -> bool {
        let at = TimeStamp::now();
        self.clear_tokens(at);

        let mut no_retry = false;
        let mut is_match = false;

        {
            let tokens = self.0.tokens.read().unwrap();
            // get token
            if let Some(token) = tokens.get(&ident) {
                // check password
                if &token.pass == pass {
                    is_match = true;
                }
                // check retries limit
                if token.retry >= self.0.options.retry_lim {
                    no_retry = true;
                }
            } else {
                return false;
            }
        }

        let mut tokens = self.0.tokens.write().unwrap();

        if is_match || no_retry {
            tokens.remove(&ident);
        } else {
            let token = tokens.get_mut(&ident).unwrap();
            token.retry += 1;
        }

        is_match
    }
}

impl<S, P> IsAuthMethod<S> for OTPassAuth<S, P>
where
    S: HasUserAccess + Send + Clone + 'static,
    P: IsOTPassSender<S>,
    <S::UserAccess as IsUserAccess>::User: CanUpdateFrom<P::UserIdent>,
{
    type AuthInfo = AuthInfo<P::AuthInfo>;
    type UserIdent = UserIdent<P::UserIdent>;

    fn get_auth_info(&self, _state: &S) -> Self::AuthInfo {
        AuthInfo {
            otpass: self.0.sender.sender_info(),
        }
    }

    fn try_user_auth(
        &self,
        state: &S,
        UserIdent::OTPass { ident, pass }: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        if let Some(pass) = pass {
            if self.verify_token(state, ident, pass) {
                let name = ident.get_user_name().to_string();
                let ident = ident.clone();
                Box::new(
                    (state.as_ref() as &S::UserAccess)
                        .find_user_data(&name)
                        .and_then({
                            let state = state.clone();
                            move |user| {
                                if let Some(user) = user {
                                    Either::A(ok(user))
                                } else {
                                    let mut user =
                                        <S::UserAccess as IsUserAccess>::User::create_new(name);
                                    // update info
                                    user.update_from(&ident);
                                    Either::B(
                                        (state.as_ref() as &S::UserAccess).put_user_data(user),
                                    )
                                }
                            }
                        }).map_err(|_| AuthError::BackendError),
                )
            } else {
                Box::new(err(AuthError::BadIdent))
            }
        } else {
            if let Some(password) = self.create_token(state, ident) {
                Box::new(
                    self.0
                        .sender
                        .send_password(state, ident, &password)
                        .and_then(|_| err(AuthError::NeedRetry)),
                )
            } else {
                Box::new(err(AuthError::BadIdent))
            }
        }
    }
}
