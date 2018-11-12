use auth::{AuthError, IsAuthMethod};
use futures::{
    future::{err, ok, Either},
    Future,
};
#[cfg(feature = "send_mail")]
use mail::{header, HasMailer, IsMailer, MailMessage, Mailbox, MultiPart, SinglePart};
use std::borrow::Cow;
use std::collections::HashMap;
use std::fmt;
use std::ops::RangeInclusive;
use std::sync::{Arc, RwLock};
use user::{
    gen_password, HasUserAccess, IsUserAccess, IsUserData, ARABIC_NUMBERS_AND_LATIN_LETTERS,
};
use {BoxFuture, TimeStamp};

/// One-time password auth options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OTPassOptions {
    /// Password length in chars
    pub pass_size: usize,
    /// Password dictionary
    pub pass_dict: Cow<'static, [RangeInclusive<char>]>,
    /// Dead time in milliseconds
    pub dead_time: TimeStamp,
    /// Retries limit
    pub retry_lim: usize,
}

impl Default for OTPassOptions {
    fn default() -> Self {
        Self {
            pass_size: 5,
            pass_dict: Cow::Borrowed(&ARABIC_NUMBERS_AND_LATIN_LETTERS),
            dead_time: TimeStamp::default().with_secs(5),
            retry_lim: 3,
        }
    }
}

/// One-time password auth method information
#[derive(Debug, Serialize)]
pub enum AuthInfo {
    #[serde(rename = "otpass")]
    OTPass {
        /// Auth using email address availability
        #[cfg(feature = "send_mail")]
        email: bool,
        /// Auth using phone number availability
        #[cfg(feature = "send_sms")]
        phone: bool,
    },
}

/// One-time password auth identification
#[derive(Debug, Clone, Serialize, Deserialize, Hash, PartialEq, Eq)]
#[serde(untagged)]
pub enum OTPassIdent {
    /// Auth using email address
    #[cfg(feature = "send_mail")]
    #[serde(rename = "email")]
    Email(Mailbox),

    /// Auth using phone number
    #[cfg(feature = "send_sms")]
    #[serde(rename = "phone")]
    Phone(String),
}

impl fmt::Display for OTPassIdent {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        use self::OTPassIdent::*;
        match self {
            #[cfg(feature = "send_mail")]
            Email(email) => email.fmt(f),
            #[cfg(feature = "send_sms")]
            Phone(phone) => phone.fmt(f),
        }
    }
}

/// One-time password auth user identification
#[derive(Debug, Deserialize)]
pub enum UserIdent {
    #[serde(rename = "otpass")]
    OTPass {
        #[serde(flatten)]
        ident: OTPassIdent,
        pass: Option<String>,
    },
}

/// One-time password auth token
#[derive(Debug, Serialize, Deserialize)]
pub struct AuthToken {
    /// Generated password
    pass: String,
    /// Token creating time
    ctime: TimeStamp,
    /// Auth retries
    retry: usize,
}

impl AuthToken {
    fn new(ctime: TimeStamp, options: &OTPassOptions) -> Self {
        AuthToken {
            pass: gen_password(options.pass_size, &options.pass_dict),
            ctime,
            retry: 0,
        }
    }
}

type Tokens = HashMap<OTPassIdent, AuthToken>;

struct State {
    options: OTPassOptions,
    tokens: RwLock<Tokens>,
}

/// One-Time password auth method
#[derive(Clone)]
pub struct OTPassAuth(Arc<State>);

impl OTPassAuth {
    /// Create one-time password auth method instance
    pub fn new(options: OTPassOptions) -> Self {
        OTPassAuth(Arc::new(State {
            options,
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

    fn create_token<S>(&self, _state: &S, ident: &OTPassIdent) -> Option<String> {
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

    fn verify_token<S>(&self, _state: &S, ident: &OTPassIdent, pass: &String) -> bool {
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

macro_rules! method_impl {
    ($($traits:tt)*) => {
        impl<S> IsAuthMethod<S> for OTPassAuth
        where
            S: HasUserAccess + $($traits)* + Send + Clone + 'static,
        {
            type AuthInfo = AuthInfo;
            type UserIdent = UserIdent;

            fn get_auth_info(
                &self,
                _state: &S,
            ) -> BoxFuture<Self::AuthInfo, AuthError> {
                Box::new(ok(AuthInfo::OTPass {
                    #[cfg(feature = "send_mail")]
                    email: true,
                    #[cfg(feature = "send_sms")]
                    phone: true,
                }))
            }

            fn try_user_auth(
                &self,
                state: &S,
                UserIdent::OTPass { ident, pass }: &Self::UserIdent,
            ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
                if let Some(pass) = pass {
                    if self.verify_token(state, ident, pass) {
                        complete_auth(state, ident)
                    } else {
                        Box::new(err(AuthError::BadIdent))
                    }
                } else {
                    if let Some(pass) = self.create_token(state, ident) {
                        match ident {
                            #[cfg(feature = "send_mail")]
                            OTPassIdent::Email(email) => send_email_auth(state, email, pass),
                            #[cfg(feature = "send_sms")]
                            OTPassIdent::Phone(phone) => send_phone_auth(state, phone, pass),
                        }
                    } else {
                        Box::new(err(AuthError::BadIdent))
                    }
                }
            }
        }
    };
}

#[cfg(all(feature = "send_mail", feature = "send_sms"))]
method_impl!(HasMailer + HasSmser);
#[cfg(all(feature = "send_mail", not(feature = "send_sms")))]
method_impl!(HasMailer);
#[cfg(all(not(feature = "send_mail"), feature = "send_sms"))]
method_impl!(HasSmser);

fn complete_auth<S>(
    state: &S,
    ident: &OTPassIdent,
) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError>
where
    S: HasUserAccess + Send + Clone + 'static,
{
    let ident = ident.to_string();
    Box::new(
        (state.as_ref() as &S::UserAccess)
            .find_user_data(&ident)
            .and_then({
                let state = state.clone();
                move |user| {
                    if let Some(user) = user {
                        Either::A(ok(user))
                    } else {
                        let mut user = <S::UserAccess as IsUserAccess>::User::from_name(ident);
                        Either::B((state.as_ref() as &S::UserAccess).put_user_data(user))
                    }
                }
            }).map_err(|_| AuthError::BackendError),
    )
}

#[cfg(feature = "send_mail")]
fn send_email_auth<S>(
    state: &S,
    email: &Mailbox,
    pass: String,
) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError>
where
    S: HasUserAccess + HasMailer,
{
    let message = MailMessage::create()
        .to(email.clone())
        .subject("Authentication token")
        .mime_body(
            MultiPart::alternative()
                .singlepart(
                    SinglePart::base64()
                        .header(header::ContentType(
                            "text/html; charset=utf8".parse().unwrap(),
                        )).body(format!(
                            "<p>Use the next one-time token for authentication: {}</p>",
                            pass
                        )),
                ).singlepart(
                    SinglePart::base64()
                        .header(header::ContentType(
                            "text/plain; charset=utf8".parse().unwrap(),
                        )).body(format!(
                            "Use the next one-time token for authentication: {}",
                            pass
                        )),
                ).to_string()
                .into(),
        );
    Box::new(
        (state.as_ref() as &S::Mailer)
            .send_mail(message)
            .map_err(|_| AuthError::BackendError)
            .and_then(|_| Err(AuthError::NeedRetry)),
    )
}

#[cfg(feature = "send_sms")]
fn send_phone_auth<S>(
    state: &S,
    phone: &String,
    pass: String,
) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError>
where
    S: HasUserAccess + HasSmser,
{
    let message = format!("Auth token: {}", pass);
    Box::new(
        state
            .get_smser()
            .send_sms(message)
            .map_err(|_| AuthError::BackendError)
            .and_then(|_| Err(AuthError::NeedRetry)),
    )
}
