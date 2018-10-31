use std::ops::Deref;
use std::rc::Rc;
use std::sync::Arc;

use auth::{AuthError, HasUserData};
use futures::Future;
use serde::{de::DeserializeOwned, Serialize};
use BoxFuture;

/// Authentication method interface
pub trait IsAuthMethod {
    /// Auth info type
    type AuthInfo: Serialize + Send + 'static;

    /// User identification type
    type UserIdent: DeserializeOwned + Send + 'static;

    /// Users backend type
    type Backend: HasUserData;

    /// Auth method may provide some data to client
    fn get_auth_info(&self, state: &Self::Backend) -> BoxFuture<Self::AuthInfo, AuthError>;

    /// Auth method should made some checks itself
    fn try_user_auth(
        &self,
        state: &Self::Backend,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<Self::Backend as HasUserData>::UserData, AuthError>;
}

#[derive(Debug, Serialize)]
pub struct BothAuthInfo<A, B> {
    #[serde(flatten)]
    a: A,
    #[serde(flatten)]
    b: B,
}

impl<A, B> From<(A, B)> for BothAuthInfo<A, B> {
    fn from((a, b): (A, B)) -> Self {
        Self { a, b }
    }
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum EitherUserIdent<A, B> {
    A(A),
    B(B),
}

impl<Backend, A, B> IsAuthMethod for (A, B)
where
    Backend: HasUserData,
    A: IsAuthMethod<Backend = Backend>,
    B: IsAuthMethod<Backend = Backend>,
{
    type AuthInfo = BothAuthInfo<A::AuthInfo, B::AuthInfo>;
    type UserIdent = EitherUserIdent<A::UserIdent, B::UserIdent>;
    type Backend = Backend;

    fn get_auth_info(&self, state: &Self::Backend) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(
            self.0
                .get_auth_info(state)
                .join(self.1.get_auth_info(state))
                .map(BothAuthInfo::from),
        )
    }

    fn try_user_auth(
        &self,
        state: &Self::Backend,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<Self::Backend as HasUserData>::UserData, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(b) => self.1.try_user_auth(state, b),
        }
    }
}

impl<Backend, A, B, C> IsAuthMethod for (A, B, C)
where
    Backend: HasUserData,
    A: IsAuthMethod<Backend = Backend>,
    B: IsAuthMethod<Backend = Backend>,
    C: IsAuthMethod<Backend = Backend>,
{
    type AuthInfo = BothAuthInfo<A::AuthInfo, BothAuthInfo<B::AuthInfo, C::AuthInfo>>;
    type UserIdent = EitherUserIdent<A::UserIdent, EitherUserIdent<B::UserIdent, C::UserIdent>>;
    type Backend = Backend;

    fn get_auth_info(&self, state: &Self::Backend) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(
            self.0
                .get_auth_info(state)
                .join(
                    self.1
                        .get_auth_info(state)
                        .join(self.2.get_auth_info(state))
                        .map(BothAuthInfo::from),
                ).map(BothAuthInfo::from),
        )
    }

    fn try_user_auth(
        &self,
        state: &Self::Backend,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<Self::Backend as HasUserData>::UserData, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(EitherUserIdent::A(b)) => self.1.try_user_auth(state, b),
            EitherUserIdent::B(EitherUserIdent::B(c)) => self.2.try_user_auth(state, c),
        }
    }
}

impl<Backend, A, B, C, D> IsAuthMethod for (A, B, C, D)
where
    Backend: HasUserData,
    A: IsAuthMethod<Backend = Backend>,
    B: IsAuthMethod<Backend = Backend>,
    C: IsAuthMethod<Backend = Backend>,
    D: IsAuthMethod<Backend = Backend>,
{
    type AuthInfo = BothAuthInfo<
        A::AuthInfo,
        BothAuthInfo<B::AuthInfo, BothAuthInfo<C::AuthInfo, D::AuthInfo>>,
    >;
    type UserIdent = EitherUserIdent<
        A::UserIdent,
        EitherUserIdent<B::UserIdent, EitherUserIdent<C::UserIdent, D::UserIdent>>,
    >;
    type Backend = Backend;

    fn get_auth_info(&self, state: &Self::Backend) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(
            self.0
                .get_auth_info(state)
                .join(
                    self.1
                        .get_auth_info(state)
                        .join(
                            self.2
                                .get_auth_info(state)
                                .join(self.3.get_auth_info(state))
                                .map(BothAuthInfo::from),
                        ).map(BothAuthInfo::from),
                ).map(BothAuthInfo::from),
        )
    }

    fn try_user_auth(
        &self,
        state: &Self::Backend,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<Self::Backend as HasUserData>::UserData, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(EitherUserIdent::A(b)) => self.1.try_user_auth(state, b),
            EitherUserIdent::B(EitherUserIdent::B(EitherUserIdent::A(c))) => {
                self.2.try_user_auth(state, c)
            }
            EitherUserIdent::B(EitherUserIdent::B(EitherUserIdent::B(d))) => {
                self.3.try_user_auth(state, d)
            }
        }
    }
}

impl<Backend, A, B, C, D, E> IsAuthMethod for (A, B, C, D, E)
where
    Backend: HasUserData,
    A: IsAuthMethod<Backend = Backend>,
    B: IsAuthMethod<Backend = Backend>,
    C: IsAuthMethod<Backend = Backend>,
    D: IsAuthMethod<Backend = Backend>,
    E: IsAuthMethod<Backend = Backend>,
{
    type AuthInfo = BothAuthInfo<
        A::AuthInfo,
        BothAuthInfo<
            B::AuthInfo,
            BothAuthInfo<C::AuthInfo, BothAuthInfo<D::AuthInfo, E::AuthInfo>>,
        >,
    >;
    type UserIdent = EitherUserIdent<
        A::UserIdent,
        EitherUserIdent<
            B::UserIdent,
            EitherUserIdent<C::UserIdent, EitherUserIdent<D::UserIdent, E::UserIdent>>,
        >,
    >;
    type Backend = Backend;

    fn get_auth_info(&self, state: &Self::Backend) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(
            self.0
                .get_auth_info(state)
                .join(
                    self.1
                        .get_auth_info(state)
                        .join(
                            self.2
                                .get_auth_info(state)
                                .join(
                                    self.3
                                        .get_auth_info(state)
                                        .join(self.4.get_auth_info(state))
                                        .map(BothAuthInfo::from),
                                ).map(BothAuthInfo::from),
                        ).map(BothAuthInfo::from),
                ).map(BothAuthInfo::from),
        )
    }

    fn try_user_auth(
        &self,
        state: &Self::Backend,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<Self::Backend as HasUserData>::UserData, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(EitherUserIdent::A(b)) => self.1.try_user_auth(state, b),
            EitherUserIdent::B(EitherUserIdent::B(EitherUserIdent::A(c))) => {
                self.2.try_user_auth(state, c)
            }
            EitherUserIdent::B(EitherUserIdent::B(EitherUserIdent::B(EitherUserIdent::A(d)))) => {
                self.3.try_user_auth(state, d)
            }
            EitherUserIdent::B(EitherUserIdent::B(EitherUserIdent::B(EitherUserIdent::B(e)))) => {
                self.4.try_user_auth(state, e)
            }
        }
    }
}

impl<Backend, A, B, C, D, E, F> IsAuthMethod for (A, B, C, D, E, F)
where
    Backend: HasUserData,
    A: IsAuthMethod<Backend = Backend>,
    B: IsAuthMethod<Backend = Backend>,
    C: IsAuthMethod<Backend = Backend>,
    D: IsAuthMethod<Backend = Backend>,
    E: IsAuthMethod<Backend = Backend>,
    F: IsAuthMethod<Backend = Backend>,
{
    type AuthInfo = BothAuthInfo<
        A::AuthInfo,
        BothAuthInfo<
            B::AuthInfo,
            BothAuthInfo<
                C::AuthInfo,
                BothAuthInfo<D::AuthInfo, BothAuthInfo<E::AuthInfo, F::AuthInfo>>,
            >,
        >,
    >;
    type UserIdent = EitherUserIdent<
        A::UserIdent,
        EitherUserIdent<
            B::UserIdent,
            EitherUserIdent<
                C::UserIdent,
                EitherUserIdent<D::UserIdent, EitherUserIdent<E::UserIdent, F::UserIdent>>,
            >,
        >,
    >;
    type Backend = Backend;

    fn get_auth_info(&self, state: &Self::Backend) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(
            self.0
                .get_auth_info(state)
                .join(
                    self.1
                        .get_auth_info(state)
                        .join(
                            self.2
                                .get_auth_info(state)
                                .join(
                                    self.3
                                        .get_auth_info(state)
                                        .join(
                                            self.4
                                                .get_auth_info(state)
                                                .join(self.5.get_auth_info(state))
                                                .map(BothAuthInfo::from),
                                        ).map(BothAuthInfo::from),
                                ).map(BothAuthInfo::from),
                        ).map(BothAuthInfo::from),
                ).map(BothAuthInfo::from),
        )
    }

    fn try_user_auth(
        &self,
        state: &Self::Backend,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<Self::Backend as HasUserData>::UserData, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(EitherUserIdent::A(b)) => self.1.try_user_auth(state, b),
            EitherUserIdent::B(EitherUserIdent::B(EitherUserIdent::A(c))) => {
                self.2.try_user_auth(state, c)
            }
            EitherUserIdent::B(EitherUserIdent::B(EitherUserIdent::B(EitherUserIdent::A(d)))) => {
                self.3.try_user_auth(state, d)
            }
            EitherUserIdent::B(EitherUserIdent::B(EitherUserIdent::B(EitherUserIdent::B(
                EitherUserIdent::A(e),
            )))) => self.4.try_user_auth(state, e),
            EitherUserIdent::B(EitherUserIdent::B(EitherUserIdent::B(EitherUserIdent::B(
                EitherUserIdent::B(f),
            )))) => self.5.try_user_auth(state, f),
        }
    }
}

/// Access to auth method
pub trait HasAuthMethod {
    /// Auth method type
    type AuthMethod: IsAuthMethod;

    /// Get auth method
    fn get_auth_method(&self) -> &Self::AuthMethod;
}

impl<'a, T: HasAuthMethod> HasAuthMethod for &'a T {
    type AuthMethod = T::AuthMethod;

    fn get_auth_method(&self) -> &Self::AuthMethod {
        (*self).get_auth_method()
    }
}

impl<T: HasAuthMethod> HasAuthMethod for Arc<T> {
    type AuthMethod = T::AuthMethod;

    fn get_auth_method(&self) -> &Self::AuthMethod {
        self.deref().get_auth_method()
    }
}

impl<T: HasAuthMethod> HasAuthMethod for Rc<T> {
    type AuthMethod = T::AuthMethod;

    fn get_auth_method(&self) -> &Self::AuthMethod {
        self.deref().get_auth_method()
    }
}
