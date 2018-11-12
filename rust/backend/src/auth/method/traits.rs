use auth::AuthError;
use futures::Future;
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
    fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError>;

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

/*
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
    ($i:tt, $j:tt) => {
        self.$i
            .get_auth_info(state)
            .join(self.$j.get_auth_info(state))
            .map(BothAuthInfo::from)
    };
    ($i:tt, $($j:tt),+) => {
        self.$i
            .get_auth_info(state)
            .join(get_auth_info!($($j),+))
            .map(BothAuthInfo::from)
    };
}

macro_rules! try_user_auth {
    ($i:tt, $j:tt) => {
        match ident {
            EitherUserIdent::A(a) => self.$i.try_user_auth(state, a),
            EitherUserIdent::B(b) => self.$j.try_user_auth(state, b),
        }
    };
    ($i:tt, $($j:tt),+) => {
        match ident {
            EitherUserIdent::A(a) => self.$i.try_user_auth(state, a),
            EitherUserIdent::B(ident) => try_user_auth!($($j),+),
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

            fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError> {
                Box::new(
                    get_auth_info!($($id),+) // WTF?! Compilation error here
                )
            }

            fn try_user_auth(
                &self,
                state: &S,
                ident: &Self::UserIdent,
            ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
                try_user_auth!($($id),+)
            }
        }
    };
}

// WTF???!!!!! Very strange behavior
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
*/

// Using pre-expanded

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
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
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
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(ident) => match ident {
                EitherUserIdent::A(a) => self.1.try_user_auth(state, a),
                EitherUserIdent::B(b) => self.2.try_user_auth(state, b),
            },
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
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(ident) => match ident {
                EitherUserIdent::A(a) => self.1.try_user_auth(state, a),
                EitherUserIdent::B(ident) => match ident {
                    EitherUserIdent::A(a) => self.2.try_user_auth(state, a),
                    EitherUserIdent::B(b) => self.3.try_user_auth(state, b),
                },
            },
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
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(ident) => match ident {
                EitherUserIdent::A(a) => self.1.try_user_auth(state, a),
                EitherUserIdent::B(ident) => match ident {
                    EitherUserIdent::A(a) => self.2.try_user_auth(state, a),
                    EitherUserIdent::B(ident) => match ident {
                        EitherUserIdent::A(a) => self.3.try_user_auth(state, a),
                        EitherUserIdent::B(b) => self.4.try_user_auth(state, b),
                    },
                },
            },
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
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(ident) => match ident {
                EitherUserIdent::A(a) => self.1.try_user_auth(state, a),
                EitherUserIdent::B(ident) => match ident {
                    EitherUserIdent::A(a) => self.2.try_user_auth(state, a),
                    EitherUserIdent::B(ident) => match ident {
                        EitherUserIdent::A(a) => self.3.try_user_auth(state, a),
                        EitherUserIdent::B(ident) => match ident {
                            EitherUserIdent::A(a) => self.4.try_user_auth(state, a),
                            EitherUserIdent::B(b) => self.5.try_user_auth(state, b),
                        },
                    },
                },
            },
        }
    }
}
impl<S, A, B, C, D, E, F, G> IsAuthMethod<S> for (A, B, C, D, E, F, G)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
    C: IsAuthMethod<S>,
    D: IsAuthMethod<S>,
    E: IsAuthMethod<S>,
    F: IsAuthMethod<S>,
    G: IsAuthMethod<S>,
{
    type AuthInfo = BothAuthInfo<
        A::AuthInfo,
        BothAuthInfo<
            B::AuthInfo,
            BothAuthInfo<
                C::AuthInfo,
                BothAuthInfo<
                    D::AuthInfo,
                    BothAuthInfo<E::AuthInfo, BothAuthInfo<F::AuthInfo, G::AuthInfo>>,
                >,
            >,
        >,
    >;
    type UserIdent = EitherUserIdent<
        A::UserIdent,
        EitherUserIdent<
            B::UserIdent,
            EitherUserIdent<
                C::UserIdent,
                EitherUserIdent<
                    D::UserIdent,
                    EitherUserIdent<E::UserIdent, EitherUserIdent<F::UserIdent, G::UserIdent>>,
                >,
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
                                                .join(
                                                    self.5
                                                        .get_auth_info(state)
                                                        .join(self.6.get_auth_info(state))
                                                        .map(BothAuthInfo::from),
                                                ).map(BothAuthInfo::from),
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
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(ident) => match ident {
                EitherUserIdent::A(a) => self.1.try_user_auth(state, a),
                EitherUserIdent::B(ident) => match ident {
                    EitherUserIdent::A(a) => self.2.try_user_auth(state, a),
                    EitherUserIdent::B(ident) => match ident {
                        EitherUserIdent::A(a) => self.3.try_user_auth(state, a),
                        EitherUserIdent::B(ident) => match ident {
                            EitherUserIdent::A(a) => self.4.try_user_auth(state, a),
                            EitherUserIdent::B(ident) => match ident {
                                EitherUserIdent::A(a) => self.5.try_user_auth(state, a),
                                EitherUserIdent::B(b) => self.6.try_user_auth(state, b),
                            },
                        },
                    },
                },
            },
        }
    }
}
impl<S, A, B, C, D, E, F, G, H> IsAuthMethod<S> for (A, B, C, D, E, F, G, H)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
    C: IsAuthMethod<S>,
    D: IsAuthMethod<S>,
    E: IsAuthMethod<S>,
    F: IsAuthMethod<S>,
    G: IsAuthMethod<S>,
    H: IsAuthMethod<S>,
{
    type AuthInfo = BothAuthInfo<
        A::AuthInfo,
        BothAuthInfo<
            B::AuthInfo,
            BothAuthInfo<
                C::AuthInfo,
                BothAuthInfo<
                    D::AuthInfo,
                    BothAuthInfo<
                        E::AuthInfo,
                        BothAuthInfo<F::AuthInfo, BothAuthInfo<G::AuthInfo, H::AuthInfo>>,
                    >,
                >,
            >,
        >,
    >;
    type UserIdent = EitherUserIdent<
        A::UserIdent,
        EitherUserIdent<
            B::UserIdent,
            EitherUserIdent<
                C::UserIdent,
                EitherUserIdent<
                    D::UserIdent,
                    EitherUserIdent<
                        E::UserIdent,
                        EitherUserIdent<F::UserIdent, EitherUserIdent<G::UserIdent, H::UserIdent>>,
                    >,
                >,
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
                                                .join(
                                                    self.5
                                                        .get_auth_info(state)
                                                        .join(
                                                            self.6
                                                                .get_auth_info(state)
                                                                .join(self.7.get_auth_info(state))
                                                                .map(BothAuthInfo::from),
                                                        ).map(BothAuthInfo::from),
                                                ).map(BothAuthInfo::from),
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
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(ident) => match ident {
                EitherUserIdent::A(a) => self.1.try_user_auth(state, a),
                EitherUserIdent::B(ident) => match ident {
                    EitherUserIdent::A(a) => self.2.try_user_auth(state, a),
                    EitherUserIdent::B(ident) => match ident {
                        EitherUserIdent::A(a) => self.3.try_user_auth(state, a),
                        EitherUserIdent::B(ident) => match ident {
                            EitherUserIdent::A(a) => self.4.try_user_auth(state, a),
                            EitherUserIdent::B(ident) => match ident {
                                EitherUserIdent::A(a) => self.5.try_user_auth(state, a),
                                EitherUserIdent::B(ident) => match ident {
                                    EitherUserIdent::A(a) => self.6.try_user_auth(state, a),
                                    EitherUserIdent::B(b) => self.7.try_user_auth(state, b),
                                },
                            },
                        },
                    },
                },
            },
        }
    }
}
impl<S, A, B, C, D, E, F, G, H, I> IsAuthMethod<S> for (A, B, C, D, E, F, G, H, I)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
    C: IsAuthMethod<S>,
    D: IsAuthMethod<S>,
    E: IsAuthMethod<S>,
    F: IsAuthMethod<S>,
    G: IsAuthMethod<S>,
    H: IsAuthMethod<S>,
    I: IsAuthMethod<S>,
{
    type AuthInfo = BothAuthInfo<
        A::AuthInfo,
        BothAuthInfo<
            B::AuthInfo,
            BothAuthInfo<
                C::AuthInfo,
                BothAuthInfo<
                    D::AuthInfo,
                    BothAuthInfo<
                        E::AuthInfo,
                        BothAuthInfo<
                            F::AuthInfo,
                            BothAuthInfo<G::AuthInfo, BothAuthInfo<H::AuthInfo, I::AuthInfo>>,
                        >,
                    >,
                >,
            >,
        >,
    >;
    type UserIdent = EitherUserIdent<
        A::UserIdent,
        EitherUserIdent<
            B::UserIdent,
            EitherUserIdent<
                C::UserIdent,
                EitherUserIdent<
                    D::UserIdent,
                    EitherUserIdent<
                        E::UserIdent,
                        EitherUserIdent<
                            F::UserIdent,
                            EitherUserIdent<
                                G::UserIdent,
                                EitherUserIdent<H::UserIdent, I::UserIdent>,
                            >,
                        >,
                    >,
                >,
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
                                                .join(
                                                    self.5
                                                        .get_auth_info(state)
                                                        .join(
                                                            self.6
                                                                .get_auth_info(state)
                                                                .join(
                                                                    self.7
                                                                        .get_auth_info(state)
                                                                        .join(
                                                                            self.8.get_auth_info(
                                                                                state,
                                                                            ),
                                                                        ).map(BothAuthInfo::from),
                                                                ).map(BothAuthInfo::from),
                                                        ).map(BothAuthInfo::from),
                                                ).map(BothAuthInfo::from),
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
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(ident) => match ident {
                EitherUserIdent::A(a) => self.1.try_user_auth(state, a),
                EitherUserIdent::B(ident) => match ident {
                    EitherUserIdent::A(a) => self.2.try_user_auth(state, a),
                    EitherUserIdent::B(ident) => match ident {
                        EitherUserIdent::A(a) => self.3.try_user_auth(state, a),
                        EitherUserIdent::B(ident) => match ident {
                            EitherUserIdent::A(a) => self.4.try_user_auth(state, a),
                            EitherUserIdent::B(ident) => match ident {
                                EitherUserIdent::A(a) => self.5.try_user_auth(state, a),
                                EitherUserIdent::B(ident) => match ident {
                                    EitherUserIdent::A(a) => self.6.try_user_auth(state, a),
                                    EitherUserIdent::B(ident) => match ident {
                                        EitherUserIdent::A(a) => self.7.try_user_auth(state, a),
                                        EitherUserIdent::B(b) => self.8.try_user_auth(state, b),
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }
    }
}
impl<S, A, B, C, D, E, F, G, H, I, J> IsAuthMethod<S> for (A, B, C, D, E, F, G, H, I, J)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
    C: IsAuthMethod<S>,
    D: IsAuthMethod<S>,
    E: IsAuthMethod<S>,
    F: IsAuthMethod<S>,
    G: IsAuthMethod<S>,
    H: IsAuthMethod<S>,
    I: IsAuthMethod<S>,
    J: IsAuthMethod<S>,
{
    type AuthInfo = BothAuthInfo<
        A::AuthInfo,
        BothAuthInfo<
            B::AuthInfo,
            BothAuthInfo<
                C::AuthInfo,
                BothAuthInfo<
                    D::AuthInfo,
                    BothAuthInfo<
                        E::AuthInfo,
                        BothAuthInfo<
                            F::AuthInfo,
                            BothAuthInfo<
                                G::AuthInfo,
                                BothAuthInfo<H::AuthInfo, BothAuthInfo<I::AuthInfo, J::AuthInfo>>,
                            >,
                        >,
                    >,
                >,
            >,
        >,
    >;
    type UserIdent = EitherUserIdent<
        A::UserIdent,
        EitherUserIdent<
            B::UserIdent,
            EitherUserIdent<
                C::UserIdent,
                EitherUserIdent<
                    D::UserIdent,
                    EitherUserIdent<
                        E::UserIdent,
                        EitherUserIdent<
                            F::UserIdent,
                            EitherUserIdent<
                                G::UserIdent,
                                EitherUserIdent<
                                    H::UserIdent,
                                    EitherUserIdent<I::UserIdent, J::UserIdent>,
                                >,
                            >,
                        >,
                    >,
                >,
            >,
        >,
    >;
    fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(self.0.get_auth_info(state).join(self.1.get_auth_info(state).join(self.2.get_auth_info(state).join(self.3.get_auth_info(state).join(self.4.get_auth_info(state).join(self.5.get_auth_info(state).join(self.6.get_auth_info(state).join(self.7.get_auth_info(state).join(self.8.get_auth_info(state).join(self.9.get_auth_info(state)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from))
    }
    fn try_user_auth(
        &self,
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(ident) => match ident {
                EitherUserIdent::A(a) => self.1.try_user_auth(state, a),
                EitherUserIdent::B(ident) => match ident {
                    EitherUserIdent::A(a) => self.2.try_user_auth(state, a),
                    EitherUserIdent::B(ident) => match ident {
                        EitherUserIdent::A(a) => self.3.try_user_auth(state, a),
                        EitherUserIdent::B(ident) => match ident {
                            EitherUserIdent::A(a) => self.4.try_user_auth(state, a),
                            EitherUserIdent::B(ident) => match ident {
                                EitherUserIdent::A(a) => self.5.try_user_auth(state, a),
                                EitherUserIdent::B(ident) => match ident {
                                    EitherUserIdent::A(a) => self.6.try_user_auth(state, a),
                                    EitherUserIdent::B(ident) => match ident {
                                        EitherUserIdent::A(a) => self.7.try_user_auth(state, a),
                                        EitherUserIdent::B(ident) => match ident {
                                            EitherUserIdent::A(a) => self.8.try_user_auth(state, a),
                                            EitherUserIdent::B(b) => self.9.try_user_auth(state, b),
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }
    }
}
impl<S, A, B, C, D, E, F, G, H, I, J, K> IsAuthMethod<S> for (A, B, C, D, E, F, G, H, I, J, K)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
    C: IsAuthMethod<S>,
    D: IsAuthMethod<S>,
    E: IsAuthMethod<S>,
    F: IsAuthMethod<S>,
    G: IsAuthMethod<S>,
    H: IsAuthMethod<S>,
    I: IsAuthMethod<S>,
    J: IsAuthMethod<S>,
    K: IsAuthMethod<S>,
{
    type AuthInfo = BothAuthInfo<
        A::AuthInfo,
        BothAuthInfo<
            B::AuthInfo,
            BothAuthInfo<
                C::AuthInfo,
                BothAuthInfo<
                    D::AuthInfo,
                    BothAuthInfo<
                        E::AuthInfo,
                        BothAuthInfo<
                            F::AuthInfo,
                            BothAuthInfo<
                                G::AuthInfo,
                                BothAuthInfo<
                                    H::AuthInfo,
                                    BothAuthInfo<
                                        I::AuthInfo,
                                        BothAuthInfo<J::AuthInfo, K::AuthInfo>,
                                    >,
                                >,
                            >,
                        >,
                    >,
                >,
            >,
        >,
    >;
    type UserIdent = EitherUserIdent<
        A::UserIdent,
        EitherUserIdent<
            B::UserIdent,
            EitherUserIdent<
                C::UserIdent,
                EitherUserIdent<
                    D::UserIdent,
                    EitherUserIdent<
                        E::UserIdent,
                        EitherUserIdent<
                            F::UserIdent,
                            EitherUserIdent<
                                G::UserIdent,
                                EitherUserIdent<
                                    H::UserIdent,
                                    EitherUserIdent<
                                        I::UserIdent,
                                        EitherUserIdent<J::UserIdent, K::UserIdent>,
                                    >,
                                >,
                            >,
                        >,
                    >,
                >,
            >,
        >,
    >;
    fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(self.0.get_auth_info(state).join(self.1.get_auth_info(state).join(self.2.get_auth_info(state).join(self.3.get_auth_info(state).join(self.4.get_auth_info(state).join(self.5.get_auth_info(state).join(self.6.get_auth_info(state).join(self.7.get_auth_info(state).join(self.8.get_auth_info(state).join(self.9.get_auth_info(state).join(self.10.get_auth_info(state)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from))
    }
    fn try_user_auth(
        &self,
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(ident) => match ident {
                EitherUserIdent::A(a) => self.1.try_user_auth(state, a),
                EitherUserIdent::B(ident) => match ident {
                    EitherUserIdent::A(a) => self.2.try_user_auth(state, a),
                    EitherUserIdent::B(ident) => match ident {
                        EitherUserIdent::A(a) => self.3.try_user_auth(state, a),
                        EitherUserIdent::B(ident) => match ident {
                            EitherUserIdent::A(a) => self.4.try_user_auth(state, a),
                            EitherUserIdent::B(ident) => match ident {
                                EitherUserIdent::A(a) => self.5.try_user_auth(state, a),
                                EitherUserIdent::B(ident) => match ident {
                                    EitherUserIdent::A(a) => self.6.try_user_auth(state, a),
                                    EitherUserIdent::B(ident) => match ident {
                                        EitherUserIdent::A(a) => self.7.try_user_auth(state, a),
                                        EitherUserIdent::B(ident) => match ident {
                                            EitherUserIdent::A(a) => self.8.try_user_auth(state, a),
                                            EitherUserIdent::B(ident) => match ident {
                                                EitherUserIdent::A(a) => {
                                                    self.9.try_user_auth(state, a)
                                                }
                                                EitherUserIdent::B(b) => {
                                                    self.10.try_user_auth(state, b)
                                                }
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }
    }
}
impl<S, A, B, C, D, E, F, G, H, I, J, K, L> IsAuthMethod<S> for (A, B, C, D, E, F, G, H, I, J, K, L)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
    C: IsAuthMethod<S>,
    D: IsAuthMethod<S>,
    E: IsAuthMethod<S>,
    F: IsAuthMethod<S>,
    G: IsAuthMethod<S>,
    H: IsAuthMethod<S>,
    I: IsAuthMethod<S>,
    J: IsAuthMethod<S>,
    K: IsAuthMethod<S>,
    L: IsAuthMethod<S>,
{
    type AuthInfo = BothAuthInfo<
        A::AuthInfo,
        BothAuthInfo<
            B::AuthInfo,
            BothAuthInfo<
                C::AuthInfo,
                BothAuthInfo<
                    D::AuthInfo,
                    BothAuthInfo<
                        E::AuthInfo,
                        BothAuthInfo<
                            F::AuthInfo,
                            BothAuthInfo<
                                G::AuthInfo,
                                BothAuthInfo<
                                    H::AuthInfo,
                                    BothAuthInfo<
                                        I::AuthInfo,
                                        BothAuthInfo<
                                            J::AuthInfo,
                                            BothAuthInfo<K::AuthInfo, L::AuthInfo>,
                                        >,
                                    >,
                                >,
                            >,
                        >,
                    >,
                >,
            >,
        >,
    >;
    type UserIdent = EitherUserIdent<
        A::UserIdent,
        EitherUserIdent<
            B::UserIdent,
            EitherUserIdent<
                C::UserIdent,
                EitherUserIdent<
                    D::UserIdent,
                    EitherUserIdent<
                        E::UserIdent,
                        EitherUserIdent<
                            F::UserIdent,
                            EitherUserIdent<
                                G::UserIdent,
                                EitherUserIdent<
                                    H::UserIdent,
                                    EitherUserIdent<
                                        I::UserIdent,
                                        EitherUserIdent<
                                            J::UserIdent,
                                            EitherUserIdent<K::UserIdent, L::UserIdent>,
                                        >,
                                    >,
                                >,
                            >,
                        >,
                    >,
                >,
            >,
        >,
    >;
    fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(self.0.get_auth_info(state).join(self.1.get_auth_info(state).join(self.2.get_auth_info(state).join(self.3.get_auth_info(state).join(self.4.get_auth_info(state).join(self.5.get_auth_info(state).join(self.6.get_auth_info(state).join(self.7.get_auth_info(state).join(self.8.get_auth_info(state).join(self.9.get_auth_info(state).join(self.10.get_auth_info(state).join(self.11.get_auth_info(state)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from))
    }
    fn try_user_auth(
        &self,
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(ident) => match ident {
                EitherUserIdent::A(a) => self.1.try_user_auth(state, a),
                EitherUserIdent::B(ident) => match ident {
                    EitherUserIdent::A(a) => self.2.try_user_auth(state, a),
                    EitherUserIdent::B(ident) => match ident {
                        EitherUserIdent::A(a) => self.3.try_user_auth(state, a),
                        EitherUserIdent::B(ident) => match ident {
                            EitherUserIdent::A(a) => self.4.try_user_auth(state, a),
                            EitherUserIdent::B(ident) => match ident {
                                EitherUserIdent::A(a) => self.5.try_user_auth(state, a),
                                EitherUserIdent::B(ident) => match ident {
                                    EitherUserIdent::A(a) => self.6.try_user_auth(state, a),
                                    EitherUserIdent::B(ident) => match ident {
                                        EitherUserIdent::A(a) => self.7.try_user_auth(state, a),
                                        EitherUserIdent::B(ident) => match ident {
                                            EitherUserIdent::A(a) => self.8.try_user_auth(state, a),
                                            EitherUserIdent::B(ident) => match ident {
                                                EitherUserIdent::A(a) => {
                                                    self.9.try_user_auth(state, a)
                                                }
                                                EitherUserIdent::B(ident) => match ident {
                                                    EitherUserIdent::A(a) => {
                                                        self.10.try_user_auth(state, a)
                                                    }
                                                    EitherUserIdent::B(b) => {
                                                        self.11.try_user_auth(state, b)
                                                    }
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }
    }
}
impl<S, A, B, C, D, E, F, G, H, I, J, K, L, M> IsAuthMethod<S>
    for (A, B, C, D, E, F, G, H, I, J, K, L, M)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
    C: IsAuthMethod<S>,
    D: IsAuthMethod<S>,
    E: IsAuthMethod<S>,
    F: IsAuthMethod<S>,
    G: IsAuthMethod<S>,
    H: IsAuthMethod<S>,
    I: IsAuthMethod<S>,
    J: IsAuthMethod<S>,
    K: IsAuthMethod<S>,
    L: IsAuthMethod<S>,
    M: IsAuthMethod<S>,
{
    type AuthInfo = BothAuthInfo<
        A::AuthInfo,
        BothAuthInfo<
            B::AuthInfo,
            BothAuthInfo<
                C::AuthInfo,
                BothAuthInfo<
                    D::AuthInfo,
                    BothAuthInfo<
                        E::AuthInfo,
                        BothAuthInfo<
                            F::AuthInfo,
                            BothAuthInfo<
                                G::AuthInfo,
                                BothAuthInfo<
                                    H::AuthInfo,
                                    BothAuthInfo<
                                        I::AuthInfo,
                                        BothAuthInfo<
                                            J::AuthInfo,
                                            BothAuthInfo<
                                                K::AuthInfo,
                                                BothAuthInfo<L::AuthInfo, M::AuthInfo>,
                                            >,
                                        >,
                                    >,
                                >,
                            >,
                        >,
                    >,
                >,
            >,
        >,
    >;
    type UserIdent = EitherUserIdent<
        A::UserIdent,
        EitherUserIdent<
            B::UserIdent,
            EitherUserIdent<
                C::UserIdent,
                EitherUserIdent<
                    D::UserIdent,
                    EitherUserIdent<
                        E::UserIdent,
                        EitherUserIdent<
                            F::UserIdent,
                            EitherUserIdent<
                                G::UserIdent,
                                EitherUserIdent<
                                    H::UserIdent,
                                    EitherUserIdent<
                                        I::UserIdent,
                                        EitherUserIdent<
                                            J::UserIdent,
                                            EitherUserIdent<
                                                K::UserIdent,
                                                EitherUserIdent<L::UserIdent, M::UserIdent>,
                                            >,
                                        >,
                                    >,
                                >,
                            >,
                        >,
                    >,
                >,
            >,
        >,
    >;
    fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(self.0.get_auth_info(state).join(self.1.get_auth_info(state).join(self.2.get_auth_info(state).join(self.3.get_auth_info(state).join(self.4.get_auth_info(state).join(self.5.get_auth_info(state).join(self.6.get_auth_info(state).join(self.7.get_auth_info(state).join(self.8.get_auth_info(state).join(self.9.get_auth_info(state).join(self.10.get_auth_info(state).join(self.11.get_auth_info(state).join(self.12.get_auth_info(state)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from))
    }
    fn try_user_auth(
        &self,
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(ident) => match ident {
                EitherUserIdent::A(a) => self.1.try_user_auth(state, a),
                EitherUserIdent::B(ident) => match ident {
                    EitherUserIdent::A(a) => self.2.try_user_auth(state, a),
                    EitherUserIdent::B(ident) => match ident {
                        EitherUserIdent::A(a) => self.3.try_user_auth(state, a),
                        EitherUserIdent::B(ident) => match ident {
                            EitherUserIdent::A(a) => self.4.try_user_auth(state, a),
                            EitherUserIdent::B(ident) => match ident {
                                EitherUserIdent::A(a) => self.5.try_user_auth(state, a),
                                EitherUserIdent::B(ident) => match ident {
                                    EitherUserIdent::A(a) => self.6.try_user_auth(state, a),
                                    EitherUserIdent::B(ident) => match ident {
                                        EitherUserIdent::A(a) => self.7.try_user_auth(state, a),
                                        EitherUserIdent::B(ident) => match ident {
                                            EitherUserIdent::A(a) => self.8.try_user_auth(state, a),
                                            EitherUserIdent::B(ident) => match ident {
                                                EitherUserIdent::A(a) => {
                                                    self.9.try_user_auth(state, a)
                                                }
                                                EitherUserIdent::B(ident) => match ident {
                                                    EitherUserIdent::A(a) => {
                                                        self.10.try_user_auth(state, a)
                                                    }
                                                    EitherUserIdent::B(ident) => match ident {
                                                        EitherUserIdent::A(a) => {
                                                            self.11.try_user_auth(state, a)
                                                        }
                                                        EitherUserIdent::B(b) => {
                                                            self.12.try_user_auth(state, b)
                                                        }
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }
    }
}
impl<S, A, B, C, D, E, F, G, H, I, J, K, L, M, N> IsAuthMethod<S>
    for (A, B, C, D, E, F, G, H, I, J, K, L, M, N)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
    C: IsAuthMethod<S>,
    D: IsAuthMethod<S>,
    E: IsAuthMethod<S>,
    F: IsAuthMethod<S>,
    G: IsAuthMethod<S>,
    H: IsAuthMethod<S>,
    I: IsAuthMethod<S>,
    J: IsAuthMethod<S>,
    K: IsAuthMethod<S>,
    L: IsAuthMethod<S>,
    M: IsAuthMethod<S>,
    N: IsAuthMethod<S>,
{
    type AuthInfo = BothAuthInfo<
        A::AuthInfo,
        BothAuthInfo<
            B::AuthInfo,
            BothAuthInfo<
                C::AuthInfo,
                BothAuthInfo<
                    D::AuthInfo,
                    BothAuthInfo<
                        E::AuthInfo,
                        BothAuthInfo<
                            F::AuthInfo,
                            BothAuthInfo<
                                G::AuthInfo,
                                BothAuthInfo<
                                    H::AuthInfo,
                                    BothAuthInfo<
                                        I::AuthInfo,
                                        BothAuthInfo<
                                            J::AuthInfo,
                                            BothAuthInfo<
                                                K::AuthInfo,
                                                BothAuthInfo<
                                                    L::AuthInfo,
                                                    BothAuthInfo<M::AuthInfo, N::AuthInfo>,
                                                >,
                                            >,
                                        >,
                                    >,
                                >,
                            >,
                        >,
                    >,
                >,
            >,
        >,
    >;
    type UserIdent = EitherUserIdent<
        A::UserIdent,
        EitherUserIdent<
            B::UserIdent,
            EitherUserIdent<
                C::UserIdent,
                EitherUserIdent<
                    D::UserIdent,
                    EitherUserIdent<
                        E::UserIdent,
                        EitherUserIdent<
                            F::UserIdent,
                            EitherUserIdent<
                                G::UserIdent,
                                EitherUserIdent<
                                    H::UserIdent,
                                    EitherUserIdent<
                                        I::UserIdent,
                                        EitherUserIdent<
                                            J::UserIdent,
                                            EitherUserIdent<
                                                K::UserIdent,
                                                EitherUserIdent<
                                                    L::UserIdent,
                                                    EitherUserIdent<M::UserIdent, N::UserIdent>,
                                                >,
                                            >,
                                        >,
                                    >,
                                >,
                            >,
                        >,
                    >,
                >,
            >,
        >,
    >;
    fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(self.0.get_auth_info(state).join(self.1.get_auth_info(state).join(self.2.get_auth_info(state).join(self.3.get_auth_info(state).join(self.4.get_auth_info(state).join(self.5.get_auth_info(state).join(self.6.get_auth_info(state).join(self.7.get_auth_info(state).join(self.8.get_auth_info(state).join(self.9.get_auth_info(state).join(self.10.get_auth_info(state).join(self.11.get_auth_info(state).join(self.12.get_auth_info(state).join(self.13.get_auth_info(state)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from))
    }
    fn try_user_auth(
        &self,
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(ident) => match ident {
                EitherUserIdent::A(a) => self.1.try_user_auth(state, a),
                EitherUserIdent::B(ident) => match ident {
                    EitherUserIdent::A(a) => self.2.try_user_auth(state, a),
                    EitherUserIdent::B(ident) => match ident {
                        EitherUserIdent::A(a) => self.3.try_user_auth(state, a),
                        EitherUserIdent::B(ident) => match ident {
                            EitherUserIdent::A(a) => self.4.try_user_auth(state, a),
                            EitherUserIdent::B(ident) => match ident {
                                EitherUserIdent::A(a) => self.5.try_user_auth(state, a),
                                EitherUserIdent::B(ident) => match ident {
                                    EitherUserIdent::A(a) => self.6.try_user_auth(state, a),
                                    EitherUserIdent::B(ident) => match ident {
                                        EitherUserIdent::A(a) => self.7.try_user_auth(state, a),
                                        EitherUserIdent::B(ident) => match ident {
                                            EitherUserIdent::A(a) => self.8.try_user_auth(state, a),
                                            EitherUserIdent::B(ident) => match ident {
                                                EitherUserIdent::A(a) => {
                                                    self.9.try_user_auth(state, a)
                                                }
                                                EitherUserIdent::B(ident) => match ident {
                                                    EitherUserIdent::A(a) => {
                                                        self.10.try_user_auth(state, a)
                                                    }
                                                    EitherUserIdent::B(ident) => match ident {
                                                        EitherUserIdent::A(a) => {
                                                            self.11.try_user_auth(state, a)
                                                        }
                                                        EitherUserIdent::B(ident) => match ident {
                                                            EitherUserIdent::A(a) => {
                                                                self.12.try_user_auth(state, a)
                                                            }
                                                            EitherUserIdent::B(b) => {
                                                                self.13.try_user_auth(state, b)
                                                            }
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }
    }
}
impl<S, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O> IsAuthMethod<S>
    for (A, B, C, D, E, F, G, H, I, J, K, L, M, N, O)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
    C: IsAuthMethod<S>,
    D: IsAuthMethod<S>,
    E: IsAuthMethod<S>,
    F: IsAuthMethod<S>,
    G: IsAuthMethod<S>,
    H: IsAuthMethod<S>,
    I: IsAuthMethod<S>,
    J: IsAuthMethod<S>,
    K: IsAuthMethod<S>,
    L: IsAuthMethod<S>,
    M: IsAuthMethod<S>,
    N: IsAuthMethod<S>,
    O: IsAuthMethod<S>,
{
    type AuthInfo = BothAuthInfo<
        A::AuthInfo,
        BothAuthInfo<
            B::AuthInfo,
            BothAuthInfo<
                C::AuthInfo,
                BothAuthInfo<
                    D::AuthInfo,
                    BothAuthInfo<
                        E::AuthInfo,
                        BothAuthInfo<
                            F::AuthInfo,
                            BothAuthInfo<
                                G::AuthInfo,
                                BothAuthInfo<
                                    H::AuthInfo,
                                    BothAuthInfo<
                                        I::AuthInfo,
                                        BothAuthInfo<
                                            J::AuthInfo,
                                            BothAuthInfo<
                                                K::AuthInfo,
                                                BothAuthInfo<
                                                    L::AuthInfo,
                                                    BothAuthInfo<
                                                        M::AuthInfo,
                                                        BothAuthInfo<N::AuthInfo, O::AuthInfo>,
                                                    >,
                                                >,
                                            >,
                                        >,
                                    >,
                                >,
                            >,
                        >,
                    >,
                >,
            >,
        >,
    >;
    type UserIdent = EitherUserIdent<
        A::UserIdent,
        EitherUserIdent<
            B::UserIdent,
            EitherUserIdent<
                C::UserIdent,
                EitherUserIdent<
                    D::UserIdent,
                    EitherUserIdent<
                        E::UserIdent,
                        EitherUserIdent<
                            F::UserIdent,
                            EitherUserIdent<
                                G::UserIdent,
                                EitherUserIdent<
                                    H::UserIdent,
                                    EitherUserIdent<
                                        I::UserIdent,
                                        EitherUserIdent<
                                            J::UserIdent,
                                            EitherUserIdent<
                                                K::UserIdent,
                                                EitherUserIdent<
                                                    L::UserIdent,
                                                    EitherUserIdent<
                                                        M::UserIdent,
                                                        EitherUserIdent<N::UserIdent, O::UserIdent>,
                                                    >,
                                                >,
                                            >,
                                        >,
                                    >,
                                >,
                            >,
                        >,
                    >,
                >,
            >,
        >,
    >;
    fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(self.0.get_auth_info(state).join(self.1.get_auth_info(state).join(self.2.get_auth_info(state).join(self.3.get_auth_info(state).join(self.4.get_auth_info(state).join(self.5.get_auth_info(state).join(self.6.get_auth_info(state).join(self.7.get_auth_info(state).join(self.8.get_auth_info(state).join(self.9.get_auth_info(state).join(self.10.get_auth_info(state).join(self.11.get_auth_info(state).join(self.12.get_auth_info(state).join(self.13.get_auth_info(state).join(self.14.get_auth_info(state)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from))
    }
    fn try_user_auth(
        &self,
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(ident) => match ident {
                EitherUserIdent::A(a) => self.1.try_user_auth(state, a),
                EitherUserIdent::B(ident) => match ident {
                    EitherUserIdent::A(a) => self.2.try_user_auth(state, a),
                    EitherUserIdent::B(ident) => match ident {
                        EitherUserIdent::A(a) => self.3.try_user_auth(state, a),
                        EitherUserIdent::B(ident) => match ident {
                            EitherUserIdent::A(a) => self.4.try_user_auth(state, a),
                            EitherUserIdent::B(ident) => match ident {
                                EitherUserIdent::A(a) => self.5.try_user_auth(state, a),
                                EitherUserIdent::B(ident) => match ident {
                                    EitherUserIdent::A(a) => self.6.try_user_auth(state, a),
                                    EitherUserIdent::B(ident) => match ident {
                                        EitherUserIdent::A(a) => self.7.try_user_auth(state, a),
                                        EitherUserIdent::B(ident) => match ident {
                                            EitherUserIdent::A(a) => self.8.try_user_auth(state, a),
                                            EitherUserIdent::B(ident) => match ident {
                                                EitherUserIdent::A(a) => {
                                                    self.9.try_user_auth(state, a)
                                                }
                                                EitherUserIdent::B(ident) => match ident {
                                                    EitherUserIdent::A(a) => {
                                                        self.10.try_user_auth(state, a)
                                                    }
                                                    EitherUserIdent::B(ident) => match ident {
                                                        EitherUserIdent::A(a) => {
                                                            self.11.try_user_auth(state, a)
                                                        }
                                                        EitherUserIdent::B(ident) => match ident {
                                                            EitherUserIdent::A(a) => {
                                                                self.12.try_user_auth(state, a)
                                                            }
                                                            EitherUserIdent::B(ident) => {
                                                                match ident {
                                                                    EitherUserIdent::A(a) => self
                                                                        .13
                                                                        .try_user_auth(state, a),
                                                                    EitherUserIdent::B(b) => self
                                                                        .14
                                                                        .try_user_auth(state, b),
                                                                }
                                                            }
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }
    }
}
impl<S, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P> IsAuthMethod<S>
    for (A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P)
where
    S: HasUserAccess,
    A: IsAuthMethod<S>,
    B: IsAuthMethod<S>,
    C: IsAuthMethod<S>,
    D: IsAuthMethod<S>,
    E: IsAuthMethod<S>,
    F: IsAuthMethod<S>,
    G: IsAuthMethod<S>,
    H: IsAuthMethod<S>,
    I: IsAuthMethod<S>,
    J: IsAuthMethod<S>,
    K: IsAuthMethod<S>,
    L: IsAuthMethod<S>,
    M: IsAuthMethod<S>,
    N: IsAuthMethod<S>,
    O: IsAuthMethod<S>,
    P: IsAuthMethod<S>,
{
    type AuthInfo = BothAuthInfo<
        A::AuthInfo,
        BothAuthInfo<
            B::AuthInfo,
            BothAuthInfo<
                C::AuthInfo,
                BothAuthInfo<
                    D::AuthInfo,
                    BothAuthInfo<
                        E::AuthInfo,
                        BothAuthInfo<
                            F::AuthInfo,
                            BothAuthInfo<
                                G::AuthInfo,
                                BothAuthInfo<
                                    H::AuthInfo,
                                    BothAuthInfo<
                                        I::AuthInfo,
                                        BothAuthInfo<
                                            J::AuthInfo,
                                            BothAuthInfo<
                                                K::AuthInfo,
                                                BothAuthInfo<
                                                    L::AuthInfo,
                                                    BothAuthInfo<
                                                        M::AuthInfo,
                                                        BothAuthInfo<
                                                            N::AuthInfo,
                                                            BothAuthInfo<O::AuthInfo, P::AuthInfo>,
                                                        >,
                                                    >,
                                                >,
                                            >,
                                        >,
                                    >,
                                >,
                            >,
                        >,
                    >,
                >,
            >,
        >,
    >;
    type UserIdent = EitherUserIdent<
        A::UserIdent,
        EitherUserIdent<
            B::UserIdent,
            EitherUserIdent<
                C::UserIdent,
                EitherUserIdent<
                    D::UserIdent,
                    EitherUserIdent<
                        E::UserIdent,
                        EitherUserIdent<
                            F::UserIdent,
                            EitherUserIdent<
                                G::UserIdent,
                                EitherUserIdent<
                                    H::UserIdent,
                                    EitherUserIdent<
                                        I::UserIdent,
                                        EitherUserIdent<
                                            J::UserIdent,
                                            EitherUserIdent<
                                                K::UserIdent,
                                                EitherUserIdent<
                                                    L::UserIdent,
                                                    EitherUserIdent<
                                                        M::UserIdent,
                                                        EitherUserIdent<
                                                            N::UserIdent,
                                                            EitherUserIdent<
                                                                O::UserIdent,
                                                                P::UserIdent,
                                                            >,
                                                        >,
                                                    >,
                                                >,
                                            >,
                                        >,
                                    >,
                                >,
                            >,
                        >,
                    >,
                >,
            >,
        >,
    >;
    fn get_auth_info(&self, state: &S) -> BoxFuture<Self::AuthInfo, AuthError> {
        Box::new(self.0.get_auth_info(state).join(self.1.get_auth_info(state).join(self.2.get_auth_info(state).join(self.3.get_auth_info(state).join(self.4.get_auth_info(state).join(self.5.get_auth_info(state).join(self.6.get_auth_info(state).join(self.7.get_auth_info(state).join(self.8.get_auth_info(state).join(self.9.get_auth_info(state).join(self.10.get_auth_info(state).join(self.11.get_auth_info(state).join(self.12.get_auth_info(state).join(self.13.get_auth_info(state).join(self.14.get_auth_info(state).join(self.15.get_auth_info(state)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from)).map(BothAuthInfo::from))
    }
    fn try_user_auth(
        &self,
        state: &S,
        ident: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match ident {
            EitherUserIdent::A(a) => self.0.try_user_auth(state, a),
            EitherUserIdent::B(ident) => match ident {
                EitherUserIdent::A(a) => self.1.try_user_auth(state, a),
                EitherUserIdent::B(ident) => match ident {
                    EitherUserIdent::A(a) => self.2.try_user_auth(state, a),
                    EitherUserIdent::B(ident) => match ident {
                        EitherUserIdent::A(a) => self.3.try_user_auth(state, a),
                        EitherUserIdent::B(ident) => match ident {
                            EitherUserIdent::A(a) => self.4.try_user_auth(state, a),
                            EitherUserIdent::B(ident) => match ident {
                                EitherUserIdent::A(a) => self.5.try_user_auth(state, a),
                                EitherUserIdent::B(ident) => match ident {
                                    EitherUserIdent::A(a) => self.6.try_user_auth(state, a),
                                    EitherUserIdent::B(ident) => match ident {
                                        EitherUserIdent::A(a) => self.7.try_user_auth(state, a),
                                        EitherUserIdent::B(ident) => match ident {
                                            EitherUserIdent::A(a) => self.8.try_user_auth(state, a),
                                            EitherUserIdent::B(ident) => match ident {
                                                EitherUserIdent::A(a) => {
                                                    self.9.try_user_auth(state, a)
                                                }
                                                EitherUserIdent::B(ident) => match ident {
                                                    EitherUserIdent::A(a) => {
                                                        self.10.try_user_auth(state, a)
                                                    }
                                                    EitherUserIdent::B(ident) => match ident {
                                                        EitherUserIdent::A(a) => {
                                                            self.11.try_user_auth(state, a)
                                                        }
                                                        EitherUserIdent::B(ident) => match ident {
                                                            EitherUserIdent::A(a) => {
                                                                self.12.try_user_auth(state, a)
                                                            }
                                                            EitherUserIdent::B(ident) => {
                                                                match ident {
                                                                    EitherUserIdent::A(a) => self
                                                                        .13
                                                                        .try_user_auth(state, a),
                                                                    EitherUserIdent::B(ident) => {
                                                                        match ident {
                                                                            EitherUserIdent::A(
                                                                                a,
                                                                            ) => self
                                                                                .14
                                                                                .try_user_auth(
                                                                                    state, a,
                                                                                ),
                                                                            EitherUserIdent::B(
                                                                                b,
                                                                            ) => self
                                                                                .15
                                                                                .try_user_auth(
                                                                                    state, b,
                                                                                ),
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }
    }
}
