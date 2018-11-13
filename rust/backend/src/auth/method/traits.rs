use auth::AuthError;
use serde::{de::DeserializeOwned, Serialize};
use user::{HasUserAccess, IsUserAccess};
use BoxFuture;

/// Authentication method interface
pub trait IsAuthMethod<S>
where
    S: HasUserAccess,
{
    /// Auth info type
    type AuthInfo: Serialize + Send + 'static;

    /// User identification type
    type UserIdent: DeserializeOwned + Send + 'static;

    /// Auth method may provide some data to client
    fn get_auth_info(&self, state: &S) -> Self::AuthInfo;

    /// Auth method should made some checks itself
    fn try_user_auth(
        &self,
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError>;
}

/// Access to auth method
pub trait HasAuthMethod
where
    Self: HasUserAccess + AsRef<<Self as HasAuthMethod>::AuthMethod> + Sized,
{
    /// Auth method type
    type AuthMethod: IsAuthMethod<Self>;
}

/// Joining of two authentication method info
#[derive(Debug, Serialize)]
pub struct BothAuthInfo<A, B> {
    #[serde(flatten)]
    a: A,
    #[serde(flatten)]
    b: B,
}

impl<A, B> BothAuthInfo<A, B> {
    pub fn new(a: A, b: B) -> Self {
        Self { a, b }
    }
}

/// Either of two alternative user identification data
#[derive(Debug, Clone, Serialize, Deserialize, Hash, PartialEq, Eq)]
#[serde(untagged)]
pub enum EitherUserIdent<A, B> {
    A(A),
    B(B),
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

macro_rules! get_auth_info {
    ($self:expr, $state:expr, $i:tt, $j:tt) => {
        BothAuthInfo::new($self.$i.get_auth_info($state), $self.$j.get_auth_info($state))
    };
    ($self:expr, $state:expr, $i:tt, $($j:tt),+) => {
        BothAuthInfo::new($self.$i.get_auth_info($state), get_auth_info!($self, $state, $($j),+))
    };
}

macro_rules! try_user_auth {
    ($self:expr, $state:expr, $ident:expr, $i:tt, $j:tt) => {
        match $ident {
            EitherUserIdent::A(a) => $self.$i.try_user_auth($state, a),
            EitherUserIdent::B(b) => $self.$j.try_user_auth($state, b),
        }
    };
    ($self:expr, $state:expr, $ident:expr, $i:tt, $($j:tt),+) => {
        match $ident {
            EitherUserIdent::A(a) => $self.$i.try_user_auth($state, a),
            EitherUserIdent::B(ident) => try_user_auth!($self, $state, ident, $($j),+),
        }
    };
}

macro_rules! tuple_method {
    (($($type:ident),+) => ($($id:tt),+)) => {
        impl<S, $($type),+> IsAuthMethod<S> for ($($type),+)
        where
            S: HasUserAccess,
            $($type: IsAuthMethod<S>),+
        {
            type AuthInfo = auth_info_type!($($type),+);
            type UserIdent = user_ident_type!($($type),+);

            fn get_auth_info(&self, state: &S) -> Self::AuthInfo {
                get_auth_info!(self, state, $($id),+)
            }

            fn try_user_auth(
                &self,
                state: &S,
                ident: &Self::UserIdent,
            ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
                try_user_auth!(self, state, ident, $($id),+)
            }
        }
    };
}

tuple_method!((A, B) => (0, 1));
tuple_method!((A, B, C) => (0, 1, 2));
tuple_method!((A, B, C, D) => (0, 1, 2, 3));
tuple_method!((A, B, C, D, E) => (0, 1, 2, 3, 4));
tuple_method!((A, B, C, D, E, F) => (0, 1, 2, 3, 4, 5));
tuple_method!((A, B, C, D, E, F, G) => (0, 1, 2, 3, 4, 5, 6));
tuple_method!((A, B, C, D, E, F, G, H) => (0, 1, 2, 3, 4, 5, 6, 7));
tuple_method!((A, B, C, D, E, F, G, H, I) => (0, 1, 2, 3, 4, 5, 6, 7, 8));
tuple_method!((A, B, C, D, E, F, G, H, I, J) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9));
tuple_method!((A, B, C, D, E, F, G, H, I, J, K) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10));
tuple_method!((A, B, C, D, E, F, G, H, I, J, K, L) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11));
tuple_method!((A, B, C, D, E, F, G, H, I, J, K, L, M) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12));
tuple_method!((A, B, C, D, E, F, G, H, I, J, K, L, M, N) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13));
tuple_method!((A, B, C, D, E, F, G, H, I, J, K, L, M, N, O) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14));
tuple_method!((A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15));
