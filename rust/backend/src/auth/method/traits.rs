use auth::{AuthError, HasUserAccess, UserAccess};
use futures::Future;
use serde::{de::DeserializeOwned, Serialize};
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
    fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError>;

    /// Auth method should made some checks itself
    fn try_user_auth(
        &self,
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as UserAccess>::User, AuthError>;
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

impl<S, A, B> IsAuthMethod<S> for (A, B)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
{
    type AuthInfo = BothAuthInfo<A::AuthInfo, B::AuthInfo>;
    type UserIdent = EitherUserIdent<A::UserIdent, B::UserIdent>;

    fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(
            self.0
                .get_auth_info(state)
                .join(self.1.get_auth_info(state))
                .map(BothAuthInfo::from),
        )
    }

    fn try_user_auth(
        &self,
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as UserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(b) => self.1.try_user_auth(state, b),
        }
    }
}

impl<S, A, B, C> IsAuthMethod<S> for (A, B, C)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
    C: IsAuthMethod<S>,
{
    type AuthInfo = BothAuthInfo<A::AuthInfo, BothAuthInfo<B::AuthInfo, C::AuthInfo>>;
    type UserIdent = EitherUserIdent<A::UserIdent, EitherUserIdent<B::UserIdent, C::UserIdent>>;

    fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError> {
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
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as UserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(EitherUserIdent::A(b)) => self.1.try_user_auth(state, b),
            EitherUserIdent::B(EitherUserIdent::B(c)) => self.2.try_user_auth(state, c),
        }
    }
}

impl<S, A, B, C, D> IsAuthMethod<S> for (A, B, C, D)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
    C: IsAuthMethod<S>,
    D: IsAuthMethod<S>,
{
    type AuthInfo = BothAuthInfo<
        A::AuthInfo,
        BothAuthInfo<B::AuthInfo, BothAuthInfo<C::AuthInfo, D::AuthInfo>>,
    >;
    type UserIdent = EitherUserIdent<
        A::UserIdent,
        EitherUserIdent<B::UserIdent, EitherUserIdent<C::UserIdent, D::UserIdent>>,
    >;

    fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError> {
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
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as UserAccess>::User, AuthError> {
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

impl<S, A, B, C, D, E> IsAuthMethod<S> for (A, B, C, D, E)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
    C: IsAuthMethod<S>,
    D: IsAuthMethod<S>,
    E: IsAuthMethod<S>,
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

    fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError> {
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
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as UserAccess>::User, AuthError> {
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

impl<S, A, B, C, D, E, F> IsAuthMethod<S> for (A, B, C, D, E, F)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
    C: IsAuthMethod<S>,
    D: IsAuthMethod<S>,
    E: IsAuthMethod<S>,
    F: IsAuthMethod<S>,
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

    fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError> {
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
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as UserAccess>::User, AuthError> {
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
pub trait HasAuthMethod
where
    Self: HasUserAccess + AsRef<<Self as HasAuthMethod>::AuthMethod> + Sized,
{
    /// Auth method type
    type AuthMethod: IsAuthMethod<Self>;
}
