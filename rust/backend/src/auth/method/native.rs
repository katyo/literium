use auth::{AuthError, HasPasswordHash, HasUserData, IsAuthMethod};
use futures::{future, Future};
use sodiumoxide::crypto::pwhash;
use std::marker::PhantomData;
use BoxFuture;

/// Native auth method information
#[derive(Debug, Serialize)]
pub enum AuthInfo {
    #[serde(rename = "native")]
    Native {},
}

/// Native auth user identification
#[derive(Debug, Deserialize)]
pub enum UserIdent {
    #[serde(rename = "native")]
    Native { name: String, pass: String },
}

/// Native auth method
#[derive(Clone, Copy)]
pub struct NativeAuth<Backend> {
    _backend: PhantomData<Backend>,
}

impl<Backend> NativeAuth<Backend> {
    pub fn new() -> Self {
        Self {
            _backend: PhantomData,
        }
    }
}

impl<Backend> IsAuthMethod for NativeAuth<Backend>
where
    Backend: HasUserData,
    Backend::UserData: HasPasswordHash + 'static,
{
    type AuthInfo = AuthInfo;
    type UserIdent = UserIdent;
    type Backend = Backend;

    fn get_auth_info(&self, _state: &Self::Backend) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(future::ok(AuthInfo::Native {}))
    }

    fn try_user_auth(
        &self,
        state: &Self::Backend,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<Self::Backend as HasUserData>::UserData, AuthError> {
        match ident {
            UserIdent::Native { name, pass } => {
                let actual_hash = hash_password(pass);
                Box::new(
                    state
                        .find_user_data(name)
                        .map_err(|error| {
                            error!("Error on find_user_data(): {}", error);
                            AuthError::BackendError
                        }).and_then(move |user| {
                            user.and_then(|user| {
                                let res = if let Some(expected_hash) = user.get_password_hash() {
                                    check_password(&actual_hash, expected_hash)
                                } else {
                                    false
                                };
                                if res {
                                    Some(user)
                                } else {
                                    None
                                }
                            }).ok_or(AuthError::BadIdent)
                        }),
                )
            }
        }
    }
}

/// Hash password utily
pub fn create_password<S: AsRef<str>>(password: S) -> Vec<u8> {
    (&hash_password(password)[..]).into()
}

/// Check password utily
pub fn verify_password<S: AsRef<str>, H: AsRef<[u8]>>(password: S, hash: H) -> bool {
    check_password(&hash_password(password), hash)
}

fn check_password<H: AsRef<[u8]>>(password: &pwhash::HashedPassword, hash: H) -> bool {
    pwhash::pwhash_verify(password, hash.as_ref())
}

fn hash_password<S: AsRef<str>>(password: S) -> pwhash::HashedPassword {
    pwhash::pwhash(
        password.as_ref().as_bytes(),
        pwhash::OPSLIMIT_INTERACTIVE,
        pwhash::MEMLIMIT_INTERACTIVE,
    ).unwrap()
}
