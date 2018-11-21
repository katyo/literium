/*!

### Native auth

This method provides classic authorization with *username* and *password*.

*/

use auth::{AuthError, IsAuthMethod};
use base::BoxFuture;
use futures::Future;
use user::{verify_password, HasPasswordHash, HasUserStorage, IsUserStorage};

/// Native auth method information
#[derive(Debug, Serialize)]
pub struct AuthInfo {
    pub native: bool,
}

/// Native auth user identification
#[derive(Debug, Deserialize)]
pub enum UserIdent {
    #[serde(rename = "native")]
    Native { name: String, pass: String },
}

/// Native auth method
#[derive(Clone, Copy)]
pub struct NativeAuth;

impl<S> IsAuthMethod<S> for NativeAuth
where
    S: HasUserStorage,
    <S::UserStorage as IsUserStorage>::User: HasPasswordHash,
{
    type AuthInfo = AuthInfo;
    type UserIdent = UserIdent;

    fn get_auth_info(&self, _state: &S) -> Self::AuthInfo {
        AuthInfo { native: true }
    }

    fn try_user_auth(
        &self,
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserStorage as IsUserStorage>::User, AuthError> {
        match ident {
            UserIdent::Native { name, pass } => {
                let pass = pass.clone();
                Box::new(
                    (state.as_ref() as &S::UserStorage)
                        .find_user_data(name)
                        .map_err(|error| {
                            error!("Error on find_user_data(): {}", error);
                            AuthError::BackendError
                        }).and_then(move |user| {
                            user.and_then(|user| {
                                let res = if let Some(hash) = user.get_password_hash() {
                                    verify_password(&pass, &hash)
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
