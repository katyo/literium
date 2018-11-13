use super::{AccessTokenRequest, AuthorizeParams, ClientParams};
use auth::AuthError;
use futures::{future::err, Future};
use serde::Serialize;
use serde_qs as qs;
use std::borrow::Cow;
use third::IsThirdService;
use user::{HasAccountAccess, IsAccountAccess};
use BoxFuture;

/// OAuth2 provider interface
pub trait IsOAuth2Provider<S, X>: IsThirdService<S, X> {
    /// Authorization endpoint URL
    fn authorize_url(&self) -> Cow<str>;

    /// Extra authorization params
    type AuthorizeParams: Serialize;

    /// Authorizaton parameters
    fn authorize_params(&self) -> Self::AuthorizeParams;

    /// Create authorization URL
    fn prepare_authorize(&self, params: &ClientParams) -> Result<String, AuthError> {
        let url = self.authorize_url().to_string();
        let params = AuthorizeParams {
            client_id: &params.client_id,
            params: self.authorize_params(),
        };
        let query = qs::to_string(&params).map_err(|error| {
            error!("Error serializing params: {}", error);
            AuthError::BackendError
        })?;
        Ok(url + "?" + &query)
    }

    /// Access token endpoint URL
    fn access_token_url(&self) -> Cow<str>;

    /// Create access token URL
    ///
    /// return URL string and POST params string
    fn prepare_access_token(
        &self,
        params: &ClientParams,
        state: &str,
        code: &str,
    ) -> Result<(Cow<str>, String), AuthError> {
        let url = self.access_token_url();
        let params = AccessTokenRequest {
            params,
            state,
            code,
        };
        let params = qs::to_string(&params).map_err(|error| {
            error!("Error serializing params: {}", error);
            AuthError::BackendError
        })?;
        Ok((url, params))
    }

    /// Fetch user info
    ///
    /// Get user info from third service
    fn fetch_user_info(&self, state: &S, access_token: Cow<str>) -> BoxFuture<X, AuthError>
    where
        X: 'static,
    {
        Box::new(self.get_user_profile(state, access_token).map_err(|error| {
            error!("Third service error: {}", error);
            AuthError::ServiceError
        }))
    }
}

impl<'a, S, T, X> IsOAuth2Provider<S, X> for &'a T
where
    T: IsOAuth2Provider<S, X>,
{
    fn authorize_url(&self) -> Cow<str> {
        (*self).authorize_url()
    }

    type AuthorizeParams = T::AuthorizeParams;

    fn authorize_params(&self) -> Self::AuthorizeParams {
        (*self).authorize_params()
    }

    fn access_token_url(&self) -> Cow<str> {
        (*self).access_token_url()
    }
}

/// State which has OAuth2 providers
pub trait HasOAuth2Providers
where
    Self: HasAccountAccess + AsRef<<Self as HasOAuth2Providers>::OAuth2Providers> + Sized,
{
    type OAuth2Providers: IsOAuth2Providers<
        Self,
        <<Self as HasAccountAccess>::AccountAccess as IsAccountAccess>::Account,
    >;
}

/// OAuth2 providers interface
///
/// Helper to combine multiple providers
pub trait IsOAuth2Providers<S, X> {
    /// Check if service exists
    fn has_service(&self, name: &str) -> bool;

    /// Create authorization URL
    fn prepare_authorize(&self, name: &str, params: &ClientParams) -> Result<String, AuthError>;

    /// Create access token URL and POST params
    fn prepare_access_token(
        &self,
        name: &str,
        params: &ClientParams,
        state: &str,
        code: &String,
    ) -> Result<(Cow<str>, String), AuthError>;

    /// Fetch user info
    fn fetch_user_info(
        &self,
        name: &str,
        state: &S,
        access_token: Cow<str>,
    ) -> BoxFuture<X, AuthError>;
}

impl<S, X, A> IsOAuth2Providers<S, X> for (A,)
where
    X: Send + 'static,
    A: IsOAuth2Provider<S, X>,
{
    fn has_service(&self, name: &str) -> bool {
        self.0.service_name() == name
    }

    fn prepare_authorize(&self, name: &str, params: &ClientParams) -> Result<String, AuthError> {
        if self.0.service_name() == name {
            self.0.prepare_authorize(params)
        } else {
            Err(AuthError::BadService)
        }
    }

    fn prepare_access_token(
        &self,
        name: &str,
        params: &ClientParams,
        state: &str,
        code: &String,
    ) -> Result<(Cow<str>, String), AuthError> {
        if self.0.service_name() == name {
            self.0.prepare_access_token(params, state, code)
        } else {
            Err(AuthError::BadService)
        }
    }

    fn fetch_user_info(
        &self,
        name: &str,
        state: &S,
        access_token: Cow<str>,
    ) -> BoxFuture<X, AuthError> {
        if self.0.service_name() == name {
            self.0.fetch_user_info(state, access_token)
        } else {
            Box::new(err(AuthError::BadService))
        }
    }
}

macro_rules! tuple_providers {
    (($($type:ident),+) -> ($($index:tt),+)) => {
        impl<S, X, $($type),+> IsOAuth2Providers<S, X> for ($($type),+)
        where
            X: Send + 'static,
            $($type: IsOAuth2Provider<S, X>),+
        {
            fn has_service(&self, name: &str) -> bool {
                $(if self.$index.service_name() == name {
                    return true;
                })+
                false
            }

            fn prepare_authorize(&self, name: &str, params: &ClientParams) -> Result<String, AuthError> {
                $(
                    if self.$index.service_name() == name {
                        return self.$index.prepare_authorize(params);
                    }
                )+
                Err(AuthError::BadService)
            }

            fn prepare_access_token(
                &self,
                name: &str,
                params: &ClientParams,
                state: &str,
                code: &String,
            ) -> Result<(Cow<str>, String), AuthError> {
                $(
                    if self.$index.service_name() == name {
                        return self.$index.prepare_access_token(params, state, code);
                    }
                )+
                Err(AuthError::BadService)
            }

            fn fetch_user_info(&self, name: &str, state: &S, access_token: Cow<str>) -> BoxFuture<X, AuthError> {
                $(
                    if self.$index.service_name() == name {
                        return self.$index.fetch_user_info(state, access_token);
                    }
                )+
                Box::new(err(AuthError::BadService))
            }
        }
    };
}

tuple_providers!((A, B) -> (0, 1));
tuple_providers!((A, B, C) -> (0, 1, 2));
tuple_providers!((A, B, C, D) -> (0, 1, 2, 3));
tuple_providers!((A, B, C, D, E) -> (0, 1, 2, 3, 4));
tuple_providers!((A, B, C, D, E, F) -> (0, 1, 2, 3, 4, 5));
tuple_providers!((A, B, C, D, E, F, G) -> (0, 1, 2, 3, 4, 5, 6));
tuple_providers!((A, B, C, D, E, F, G, H) -> (0, 1, 2, 3, 4, 5, 6, 7));
tuple_providers!((A, B, C, D, E, F, G, H, I) -> (0, 1, 2, 3, 4, 5, 6, 7, 8));
tuple_providers!((A, B, C, D, E, F, G, H, I, J) -> (0, 1, 2, 3, 4, 5, 6, 7, 8, 9));
tuple_providers!((A, B, C, D, E, F, G, H, I, J, K) -> (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10));
tuple_providers!((A, B, C, D, E, F, G, H, I, J, K, L) -> (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11));
tuple_providers!((A, B, C, D, E, F, G, H, I, J, K, L, M) -> (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12));
tuple_providers!((A, B, C, D, E, F, G, H, I, J, K, L, M, N) -> (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13));
tuple_providers!((A, B, C, D, E, F, G, H, I, J, K, L, M, N, O) -> (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14));
tuple_providers!((A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P) -> (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15));
