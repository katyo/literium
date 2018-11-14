use auth::{AuthError, EitherUserIdent};
use futures::Future;
use serde::Serialize;
use std::borrow::Cow;
use third::IsThirdService;
use user::{HasAccountAccess, IsAccountAccess};
use BoxFuture;

/// OAuth2 provider interface
pub trait IsOAuth2Provider<S, X>: IsThirdService<S, X> {
    /// Authorization endpoint URL
    fn authorize_url(&self) -> Cow<str>;

    /// Authorization scope
    fn authorize_scope(&self) -> Cow<str>;

    /// Extra authorization params
    type AuthorizeParams: Serialize + Send + 'static;

    /// Authorizaton parameters
    fn authorize_params(&self) -> Self::AuthorizeParams;

    /// Access token endpoint URL
    fn access_token_url(&self) -> Cow<str>;

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

    fn authorize_scope(&self) -> Cow<str> {
        (*self).authorize_scope()
    }

    type AuthorizeParams = T::AuthorizeParams;

    fn authorize_params(&self) -> Self::AuthorizeParams {
        (*self).authorize_params()
    }

    fn access_token_url(&self) -> Cow<str> {
        (*self).access_token_url()
    }
}

/// OAuth2 providers interface
///
/// Helper to combine multiple providers
pub trait IsOAuth2Providers<S, X> {
    /// Check if service exists
    fn has_service(&self, name: &str) -> bool;

    /// Authorization endpoint URL
    fn authorize_url(&self, name: &str) -> Cow<str>;

    /// Authorization scope
    fn authorize_scope(&self, name: &str) -> Cow<str>;

    /// Extra authorization params
    type AuthorizeParams: Serialize + Send + 'static;

    /// Authorizaton parameters
    fn authorize_params(&self, name: &str) -> Self::AuthorizeParams;

    /// Access token endpoint URL
    fn access_token_url(&self, name: &str) -> Cow<str>;

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

    fn authorize_url(&self, _name: &str) -> Cow<str> {
        self.0.authorize_url()
    }

    fn authorize_scope(&self, _name: &str) -> Cow<str> {
        self.0.authorize_scope()
    }

    type AuthorizeParams = A::AuthorizeParams;

    fn authorize_params(&self, _name: &str) -> Self::AuthorizeParams {
        self.0.authorize_params()
    }

    fn access_token_url(&self, _name: &str) -> Cow<str> {
        self.0.access_token_url()
    }

    fn fetch_user_info(
        &self,
        _name: &str,
        state: &S,
        access_token: Cow<str>,
    ) -> BoxFuture<X, AuthError> {
        self.0.fetch_user_info(state, access_token)
    }
}

macro_rules! authorize_params_type {
    ($a:ident, $b:ident) => {
        EitherUserIdent<$a::AuthorizeParams, $b::AuthorizeParams>
    };
    ($a:ident, $($b:ident),+) => {
        EitherUserIdent<$a::AuthorizeParams, authorize_params_type!($($b),+)>
    };
}

macro_rules! authorize_params {
    ($self:expr, $name:expr, $i:tt, $j:tt) => {
        if $self.$i.service_name() == $name {
            Some(EitherUserIdent::A($self.$i.authorize_params()))
        } else if $self.$j.service_name() == $name {
            Some(EitherUserIdent::B($self.$j.authorize_params()))
        } else {
            None
        }
    };
    ($self:expr, $name:expr, $i:tt, $($j:tt),+) => {
        if $self.$i.service_name() == $name {
            Some(EitherUserIdent::A($self.$i.authorize_params()))
        } else if let Some(params) = authorize_params!($self, $name, $($j),+) {
            Some(EitherUserIdent::B(params))
        } else {
            None
        }
    };
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

            fn authorize_url(&self, name: &str) -> Cow<str> {
                $(if self.$index.service_name() == name {
                    return self.$index.authorize_url();
                })+
                unreachable!();
            }

            fn authorize_scope(&self, name: &str) -> Cow<str> {
                $(if self.$index.service_name() == name {
                    return self.$index.authorize_scope();
                })+
                unreachable!();
            }

            type AuthorizeParams = authorize_params_type!($($type),+);

            fn authorize_params(&self, name: &str) -> Self::AuthorizeParams {
                authorize_params!(self, name, $($index),+).unwrap()
            }

            fn access_token_url(&self, name: &str) -> Cow<str> {
                $(if self.$index.service_name() == name {
                    return self.$index.access_token_url();
                })+
                unreachable!();
            }

            fn fetch_user_info(&self, name: &str, state: &S, access_token: Cow<str>) -> BoxFuture<X, AuthError> {
                $(if self.$index.service_name() == name {
                    return self.$index.fetch_user_info(state, access_token);
                })+
                unreachable!();
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
