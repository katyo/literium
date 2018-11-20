use super::{HasUserAccess, IsUserAccess, UserArg, UserId};
use access::{Grant, HasAccess};
use auth::{AuthError, HasSessionAccess, HasUserAuth};
use base::{CanCreateView, CanUpdateData, ResourceError};
use crypto::HasSecretKey;
use futures::{
    future::{err, Either},
    Future,
};
use warp::{Filter, Rejection, Reply};
use x_auth;

/// Handle get user data
pub fn get_user_data<S>(
    state: &S,
) -> impl Filter<Extract = (impl Reply,), Error = Rejection> + Clone
where
    S: HasSecretKey + HasUserAccess + HasUserAuth + HasSessionAccess + Send + Sync + Clone,
    S::UserAuth: HasAccess<UserArg, Grant>,
    <S::UserAccess as IsUserAccess>::User: CanCreateView<S::UserAuth, UserArg>,
{
    let state = state.clone();
    warp::get2()
        .and(warp::path::param()) // user id
        .and(x_auth(&state))
        .and_then(|user, auth: S::UserAuth| {
            auth.access_to(&UserArg { user }, &Grant::Read)
                .map(|auth: S::UserAuth| (user, auth))
        }).and_then(move |(user, auth)| {
            get_user_data_fn(&state, user, auth)
                .map_err(warp::reject::custom)
                .map(|user| warp::reply::json(&user))
        }).recover(AuthError::recover)
        .recover(ResourceError::recover)
}

fn get_user_data_fn<S>(
    state: &S,
    user: UserId,
    auth: S::UserAuth,
) -> impl Future<
    Item = <<S::UserAccess as IsUserAccess>::User as CanCreateView<S::UserAuth, UserArg>>::View,
    Error = ResourceError,
> + Send
where
    S: HasUserAccess + HasUserAuth + Send + Sync + Clone,
    S::UserAuth: HasAccess<UserArg, Grant>,
    <S::UserAccess as IsUserAccess>::User: CanCreateView<S::UserAuth, UserArg>,
{
    (state.as_ref() as &S::UserAccess)
        .get_user_data(user)
        .map_err(|error| {
            error!("Unable to get user data: {}", error);
            ResourceError::Backend
        }).and_then(move |user| {
            user.map(move |user| user.create_view(&auth))
                .ok_or_else(|| ResourceError::Missing)
        })
}

/// Handle put user data
pub fn put_user_data<S>(
    state: &S,
) -> impl Filter<Extract = (impl Reply,), Error = Rejection> + Clone
where
    S: HasSecretKey + HasUserAccess + HasUserAuth + HasSessionAccess + Send + Sync + Clone,
    S::UserAuth: HasAccess<UserArg, Grant>,
    <S::UserAccess as IsUserAccess>::User: CanUpdateData<S::UserAuth, UserArg>,
{
    let state = state.clone();

    warp::put2()
        .and(warp::path::param()) // user id
        .and(x_auth(&state))
        .and_then(|user, auth: S::UserAuth| {
            auth.access_to(&UserArg { user }, &Grant::Update)
                .map(|auth| (user, auth))
        }).and(warp::body::json::<
            <<S::UserAccess as IsUserAccess>::User as CanUpdateData<S::UserAuth, UserArg>>::View,
        >()).and_then(move |(user, auth), data| {
            put_user_data_fn(&state, user, data, auth)
                .map_err(warp::reject::custom)
                .map(|_| warp::reply())
        }).recover(AuthError::recover)
        .recover(ResourceError::recover)
}

fn put_user_data_fn<S>(
    state: &S,
    user: UserId,
    data: <<S::UserAccess as IsUserAccess>::User as CanUpdateData<S::UserAuth, UserArg>>::View,
    auth: S::UserAuth,
) -> impl Future<Item = (), Error = ResourceError>
where
    S: HasUserAccess + HasUserAuth + Send + Sync + Clone,
    S::UserAuth: HasAccess<UserArg, Grant>,
    <S::UserAccess as IsUserAccess>::User: CanUpdateData<S::UserAuth, UserArg>,
{
    let state = state.clone();

    (state.as_ref() as &S::UserAccess)
        .get_user_data(user)
        .map_err(|error| {
            error!("Unable to get user data: {}", error);
            ResourceError::Backend
        }).and_then(move |user| {
            user.map(move |mut user| {
                user.update_data(&auth, &data);
                Either::A(
                    (state.as_ref() as &S::UserAccess)
                        .put_user_data(user)
                        .map_err(|error| {
                            error!("Unable to put user data: {}", error);
                            ResourceError::Backend
                        }).map(|_| ()),
                )
            }).unwrap_or_else(|| Either::B(err(ResourceError::Missing)))
        })
}

/// Scope with user data handlers
pub fn user_scope<S>(state: &S) -> impl Filter<Extract = (impl Reply,), Error = Rejection> + Clone
where
    S: HasSecretKey + HasUserAuth + HasUserAccess + HasSessionAccess + Send + Sync + Clone,
    S::UserAuth: HasAccess<UserArg, Grant>,
    <S::UserAccess as IsUserAccess>::User:
        CanCreateView<S::UserAuth, UserArg> + CanUpdateData<S::UserAuth, UserArg>,
{
    get_user_data(state).or(put_user_data(state))
}
