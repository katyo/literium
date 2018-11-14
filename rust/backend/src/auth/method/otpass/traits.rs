use auth::{
    method::{BothAuthInfo, EitherUserIdent},
    AuthError,
};
use base::BoxFuture;
use serde::{de::DeserializeOwned, Serialize};
use std::borrow::Cow;
use std::hash::Hash;

/// One-time password auth user identification data
///
/// This is a user identification data such as email address, phone number and etc.
pub trait IsOTPassIdent {
    /// Get user name from identification data
    fn get_user_name(&self) -> Cow<str>;
}

/// One-time password auth code sender
pub trait IsOTPassSender<S> {
    /// Sender availability and info type
    ///
    /// This should be extrnally tagged enum (default enum representation in **serde**).
    /// The tag should be same as the name of provider.
    type AuthInfo: Serialize + Send + 'static;

    /// User identifier and recipient address type
    ///
    /// This should be extrnally tagged enum (default enum representation in **serde**).
    /// The tag should be same as the name of provider.
    type UserIdent: IsOTPassIdent + Hash + Eq + Clone + DeserializeOwned + Send + 'static;

    /// Get the sender info
    fn sender_info(&self) -> Self::AuthInfo;

    /// Send password using provider-specific way
    ///
    /// The password is an authentication code which user can receive and use for finish authentication.
    fn send_password(
        &self,
        state: &S,
        ident: &Self::UserIdent,
        password: &str,
    ) -> BoxFuture<(), AuthError>;
}

impl<A, B> IsOTPassIdent for EitherUserIdent<A, B>
where
    A: IsOTPassIdent,
    B: IsOTPassIdent,
{
    fn get_user_name(&self) -> Cow<str> {
        match self {
            EitherUserIdent::A(a) => a.get_user_name(),
            EitherUserIdent::B(b) => b.get_user_name(),
        }
    }
}

macro_rules! auth_info_type {
    ($a:ident, $b:ident) => {
        BothAuthInfo<$a::AuthInfo, $b::AuthInfo>
    };
    ($a:ident, $($b:ident),+) => {
        BothAuthInfo<$a::AuthInfo, auth_info_type!($($b),+)>
    };
}

macro_rules! user_ident_type {
    ($a:ident, $b:ident) => {
        EitherUserIdent<$a::UserIdent, $b::UserIdent>
    };
    ($a:ident, $($b:ident),+) => {
        EitherUserIdent<$a::UserIdent, user_ident_type!($($b),+)>
    };
}

macro_rules! sender_info {
    ($self:expr, $i:tt, $j:tt) => {
        BothAuthInfo::new($self.$i.sender_info(), $self.$j.sender_info())
    };
    ($self:expr, $i:tt, $($j:tt),+) => {
        BothAuthInfo::new($self.$i.sender_info(), sender_info!($self, $($j),+))
    };
}

macro_rules! send_password {
    ($self:expr, $state:expr, $ident:expr, $password:expr, $i:tt, $j:tt) => {
        match $ident {
            EitherUserIdent::A(a) => $self.$i.send_password($state, a, $password),
            EitherUserIdent::B(b) => $self.$j.send_password($state, b, $password),
        }
    };
    ($self:expr, $state:expr, $ident:expr, $password:expr, $i:tt, $($j:tt),+) => {
        match $ident {
            EitherUserIdent::A(a) => $self.$i.send_password($state, a, $password),
            EitherUserIdent::B(ident) => send_password!($self, $state, ident, $password, $($j),+),
        }
    };
}

macro_rules! tuple_sender {
    (($($type:ident),+) => ($($index:tt),+)) => {
        impl<S, $($type),+> IsOTPassSender<S> for ($($type),+)
        where
            $($type: IsOTPassSender<S>),+
        {
            type AuthInfo = auth_info_type!($($type),+);
            type UserIdent = user_ident_type!($($type),+);

            fn sender_info(&self) -> Self::AuthInfo {
                sender_info!(self, $($index),+)
            }

            fn send_password(
                &self,
                state: &S,
                ident: &Self::UserIdent,
                password: &str,
            ) -> BoxFuture<(), AuthError> {
                send_password!(self, state, ident, password, $($index),+)
            }
        }
    };
}

tuple_sender!((A, B) => (0, 1));
tuple_sender!((A, B, C) => (0, 1, 2));
tuple_sender!((A, B, C, D) => (0, 1, 2, 3));
tuple_sender!((A, B, C, D, E) => (0, 1, 2, 3, 4));
tuple_sender!((A, B, C, D, E, F) => (0, 1, 2, 3, 4, 5));
tuple_sender!((A, B, C, D, E, F, G) => (0, 1, 2, 3, 4, 5, 6));
tuple_sender!((A, B, C, D, E, F, G, H) => (0, 1, 2, 3, 4, 5, 6, 7));
tuple_sender!((A, B, C, D, E, F, G, H, I) => (0, 1, 2, 3, 4, 5, 6, 7, 8));
tuple_sender!((A, B, C, D, E, F, G, H, I, J) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9));
tuple_sender!((A, B, C, D, E, F, G, H, I, J, K) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10));
tuple_sender!((A, B, C, D, E, F, G, H, I, J, K, L) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11));
tuple_sender!((A, B, C, D, E, F, G, H, I, J, K, L, M) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12));
tuple_sender!((A, B, C, D, E, F, G, H, I, J, K, L, M, N) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13));
tuple_sender!((A, B, C, D, E, F, G, H, I, J, K, L, M, N, O) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14));
tuple_sender!((A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15));
