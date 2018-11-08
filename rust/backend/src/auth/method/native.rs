use auth::{verify_password, AuthError, HasPasswordHash, HasUserAccess, IsAuthMethod, UserAccess};
use futures::{future, Future};
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
pub struct NativeAuth;

impl<S> IsAuthMethod<S> for NativeAuth
where
    S: HasUserAccess,
    <S::UserAccess as UserAccess>::User: HasPasswordHash,
{
    type AuthInfo = AuthInfo;
    type UserIdent = UserIdent;

    fn get_auth_info(&self, _state: &S) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(future::ok(AuthInfo::Native {}))
    }

    fn try_user_auth(
        &self,
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as UserAccess>::User, AuthError> {
        match ident {
            UserIdent::Native { name, pass } => {
                let pass = pass.clone();
                Box::new(
                    (state.as_ref() as &S::UserAccess)
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
