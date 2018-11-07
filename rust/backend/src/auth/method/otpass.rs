use auth::{AuthError, HasUserData, IsAuthMethod, IsUserData};
use crypto::{random_bytes, HasPublicKey, HasSecretKey};
use futures::{
    future::{err, ok, Either},
    Future,
};
#[cfg(feature = "send_mail")]
use mail::{header, HasMailer, IsMailer, MailMessage, Mailbox, MultiPart, SinglePart};
use std::collections::HashMap;
use std::fmt;
use std::marker::PhantomData;
use std::sync::{Arc, RwLock};
use {BoxFuture, HasConfig, TimeStamp};

/// One-time password auth options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OTPassOptions {
    /// Password length in chars
    pub pass_size: usize,
    /// Dead time in milliseconds
    pub dead_time: TimeStamp,
    /// Retries limit
    pub retry_lim: usize,
}

impl Default for OTPassOptions {
    fn default() -> Self {
        Self {
            pass_size: 5,
            dead_time: TimeStamp::default().with_secs(5),
            retry_lim: 3,
        }
    }
}

/// Config has one-time password auth options
pub trait HasOTPassOptions {
    fn otpass_options(&self) -> &OTPassOptions;
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
            pass: gen_password(options.pass_size),
            ctime,
            retry: 0,
        }
    }
}

#[derive(Clone)]
pub struct OTPassAuth<Backend> {
    tokens: Arc<RwLock<HashMap<OTPassIdent, AuthToken>>>,
    _backend: PhantomData<Backend>,
}

impl<Backend> OTPassAuth<Backend> {
    pub fn new() -> Self {
        Self {
            tokens: Arc::new(RwLock::new(HashMap::new())),
            _backend: PhantomData,
        }
    }

    fn clear_tokens(&self, at: TimeStamp, options: &OTPassOptions) {
        // clear dead tokens
        let dt = at - options.dead_time;
        self.tokens
            .write()
            .unwrap()
            .retain(|_, token| token.ctime > dt);
    }

    fn create_token(&self, state: &Backend, ident: &OTPassIdent) -> Option<String>
    where
        Backend: HasConfig,
        Backend::Config: HasOTPassOptions,
    {
        let at = TimeStamp::now();
        let options = state.get_config().otpass_options();
        self.clear_tokens(at, options);

        {
            let tokens = self.tokens.read().unwrap();
            if tokens.contains_key(&ident) {
                return None;
            }
        }

        let mut tokens = self.tokens.write().unwrap();
        let token = AuthToken::new(at, options);
        let pass = token.pass.clone();

        tokens.insert(ident.clone(), token);

        Some(pass)
    }

    fn verify_token(&self, state: &Backend, ident: &OTPassIdent, pass: &String) -> bool
    where
        Backend: HasConfig,
        Backend::Config: HasOTPassOptions,
    {
        let at = TimeStamp::now();
        let options = state.get_config().otpass_options();
        self.clear_tokens(at, options);

        let mut no_retry = false;
        let mut is_match = false;

        {
            let tokens = self.tokens.read().unwrap();
            // get token
            if let Some(token) = tokens.get(&ident) {
                // check password
                if &token.pass == pass {
                    is_match = true;
                }
                // check retries limit
                if token.retry >= options.retry_lim {
                    no_retry = true;
                }
            } else {
                return false;
            }
        }

        let mut tokens = self.tokens.write().unwrap();

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
        impl<Backend> IsAuthMethod for OTPassAuth<Backend>
        where
            Backend: HasUserData + $($traits)* + HasConfig + Send + Clone + 'static,
            Backend::Config: HasPublicKey + HasSecretKey + HasOTPassOptions,
            Backend::UserData: 'static,
        {
            type AuthInfo = AuthInfo;
            type UserIdent = UserIdent;
            type Backend = Backend;

            fn get_auth_info(
                &self,
                _state: &Self::Backend,
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
                state: &Self::Backend,
                UserIdent::OTPass { ident, pass }: &Self::UserIdent,
            ) -> BoxFuture<<Self::Backend as HasUserData>::UserData, AuthError> {
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

fn complete_auth<Backend>(
    state: &Backend,
    ident: &OTPassIdent,
) -> BoxFuture<Backend::UserData, AuthError>
where
    Backend: HasUserData + HasMailer + HasConfig + Send + Clone + 'static,
    Backend::Config: HasPublicKey + HasSecretKey,
    Backend::UserData: 'static,
{
    let ident = ident.to_string();
    Box::new(
        state
            .find_user_data(&ident)
            .and_then({
                let state = state.clone();
                move |user| {
                    if let Some(user) = user {
                        Either::A(ok(user))
                    } else {
                        let user = Backend::UserData::from_name(ident);
                        Either::B(state.put_user_data(user))
                    }
                }
            }).map_err(|_| AuthError::BackendError),
    )
}

#[cfg(feature = "send_mail")]
fn send_email_auth<Backend>(
    state: &Backend,
    email: &Mailbox,
    pass: String,
) -> BoxFuture<Backend::UserData, AuthError>
where
    Backend: HasUserData + HasMailer + HasConfig,
    Backend::Config: HasPublicKey + HasSecretKey,
    Backend::UserData: 'static,
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
        state
            .get_mailer()
            .send_mail(message)
            .map_err(|_| AuthError::BackendError)
            .and_then(|_| Err(AuthError::NeedRetry)),
    )
}

#[cfg(feature = "send_sms")]
fn send_phone_auth<Backend>(
    state: &Backend,
    phone: &String,
    pass: String,
) -> BoxFuture<Backend::UserData, AuthError>
where
    Backend: HasUserData + HasSmser + HasConfig,
    Backend::Config: HasPublicKey + HasSecretKey,
    Backend::UserData: 'static,
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

fn gen_password(length: usize) -> String {
    random_bytes(length).into_iter().map(byte_to_char).collect()
}

fn byte_to_char(byte: u8) -> char {
    let ranges = [b'0'..=b'9', b'A'..=b'Z', b'a'..=b'z'];
    let length = ranges.iter().fold(0, |length, range| length + range.len());
    let index = byte as usize * length / 256;
    ranges
        .iter()
        .fold(Err(index), |found, range| {
            if let Err(index) = found {
                return if index < range.len() {
                    Ok((*range.start() + index as u8) as char)
                } else {
                    Err(index - range.len())
                };
            }
            found
        }).unwrap()
}
