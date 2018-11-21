use super::{
    AuthError, AuthInfo, AuthRequest, AuthResponse, HasAuthMethod, HasSessionStorage, HasUserAuth,
    IsAuthMethod, IsSessionData, IsSessionStorage, SessionArg, SessionData, SessionId, SessionInfo,
};
use access::{Grant, HasAccess};
use base::{CanCreateView, TimeStamp};
use crypto::{HasPublicKey, HasSecretKey, PublicKey};
use futures::{
    future::{err, Either},
    Future,
};
use user::{HasUserStorage, IsUserData, IsUserStorage, UserId};
use warp::{any, Filter, Rejection, Reply};
use {reply, x_auth, x_json};

/// Handle get server auth data
pub fn get_auth_info<S>(
    state: &S,
) -> impl Filter<Extract = (impl Reply,), Error = Rejection> + Clone
where
    S: HasPublicKey + HasSecretKey + HasUserAuth + HasSessionStorage + HasAuthMethod + Send + Clone,
    S::PublicKey: AsRef<PublicKey>,
    S::AuthMethod: IsAuthMethod<S>,
    S::UserAuth: HasAccess<SessionArg, Grant>,
{
    let state = state.clone();
    warp::get2()
        .and(x_auth(&state))
        .and_then(|auth: S::UserAuth| auth.access(&Grant::Create))
        .map(move |_| warp::reply::json(&get_auth_info_fn(&state)))
        .recover(AuthError::recover)
}

fn get_auth_info_fn<S>(state: &S) -> AuthInfo<<S::AuthMethod as IsAuthMethod<S>>::AuthInfo>
where
    S: HasPublicKey + HasUserStorage + HasAuthMethod,
    S::PublicKey: AsRef<PublicKey>,
    S::AuthMethod: IsAuthMethod<S>,
{
    AuthInfo::new(
        (state.as_ref() as &S::PublicKey).as_ref().clone(),
        (state.as_ref() as &S::AuthMethod).get_auth_info(&state),
    )
}

/// Handle auth requests
pub fn do_user_auth<S>(state: &S) -> impl Filter<Extract = (impl Reply,), Error = Rejection> + Clone
where
    S: HasPublicKey
        + HasSecretKey
        + HasUserStorage
        + HasUserAuth
        + HasSessionStorage
        + HasAuthMethod
        + Send
        + Sync
        + Clone,
    S::AuthMethod: IsAuthMethod<S>,
    <S::UserStorage as IsUserStorage>::User: CanCreateView<S::UserAuth, SessionArg>,
    <S::SessionStorage as IsSessionStorage>::Session: From<SessionData>,
    S::UserAuth: HasAccess<SessionArg, Grant>,
{
    let state = state.clone();

    warp::post2()
        .and(x_auth(&state))
        .and_then(|auth: S::UserAuth| auth.access(&Grant::Create))
        .and(x_json(&state))
        .and_then(move |auth, req| {
            do_user_auth_fn(&state, auth, req)
                .map(|data| reply::x_json(&data, &state))
                .map_err(warp::reject::custom)
        }).recover(AuthError::recover)
}

fn do_user_auth_fn<S>(
    state: &S,
    auth: S::UserAuth,
    req: AuthRequest<<S::AuthMethod as IsAuthMethod<S>>::UserIdent>,
) -> impl Future<
    Item = AuthResponse<
        <<S::UserStorage as IsUserStorage>::User as CanCreateView<S::UserAuth, SessionArg>>::View,
    >,
    Error = AuthError,
>
where
    S: HasSecretKey
        + HasUserStorage
        + HasUserAuth
        + HasSessionStorage
        + HasAuthMethod
        + Send
        + Clone,
    S::AuthMethod: IsAuthMethod<S>,
    <S::UserStorage as IsUserStorage>::User: CanCreateView<S::UserAuth, SessionArg>,
    <S::SessionStorage as IsSessionStorage>::Session: From<SessionData>,
{
    if TimeStamp::now().abs_delta(&req.ctime) > TimeStamp::default().with_secs(3) {
        return Either::A(err(AuthError::Outdated));
    }

    let state = state.clone();
    let ctime = req.ctime;
    let pbkey = req.pbkey;

    Either::B(
        (state.as_ref() as &S::AuthMethod)
            .try_user_auth(&state, &req.ident)
            .map_err(|error| {
                error!("Backend error on check_user_ident(): {}", error);
                AuthError::BackendError
            }).and_then(move |user| {
                (state.as_ref() as &S::SessionStorage)
                    .find_user_session(user.get_user_id(), ctime)
                    .map_err(|error| {
                        error!("Backend error on find_user_session(): {}", error);
                        AuthError::BackendError
                    }).and_then(|_| Err(AuthError::Outdated))
                    .or_else(move |_| {
                        (state.as_ref() as &S::SessionStorage)
                            .new_user_session(user.get_user_id(), pbkey)
                            .map_err(|error| {
                                error!("Backend error on new_user_session(): {}", error);
                                AuthError::BackendError
                            }).map(move |session| {
                                let extra = user.create_view(&auth);
                                let data = session.session_data();
                                AuthResponse {
                                    user: user.get_user_id(),
                                    sess: data.sess,
                                    token: data.token.clone(),
                                    extra,
                                }
                            })
                    })
            }),
    )
}

/// Handle get user sessions
pub fn get_user_sessions<S>(
    state: &S,
) -> impl Filter<Extract = (impl Reply,), Error = Rejection> + Clone
where
    S: HasSecretKey + HasUserStorage + HasUserAuth + HasSessionStorage + Send + Sync + Clone,
    S::UserAuth: HasAccess<SessionArg, Grant>,
{
    let state = state.clone();

    warp::get2()
        .and(warp::path::param()) // user id
        .and(warp::path("session"))
        .and(x_auth(&state))
        .and_then(|user, auth: S::UserAuth| {
            auth.access_to(&SessionArg { user }, &Grant::Read)
                .map(|_| user)
        }).and_then(move |user| {
            get_user_sessions_fn(&state, user)
                .map_err(warp::reject::custom)
                .map(|sessions| warp::reply::json(&sessions))
        }).recover(AuthError::recover)
}

fn get_user_sessions_fn<S>(
    state: &S,
    user: UserId,
) -> impl Future<Item = Vec<SessionInfo>, Error = AuthError>
where
    S: HasUserStorage + HasSessionStorage + HasUserAuth + Send + Sync + Clone,
{
    (state.as_ref() as &S::SessionStorage)
        .get_user_sessions(user)
        .map(|sessions| {
            sessions
                .into_iter()
                .map(|session| session.session_data().into())
                .collect()
        }).map_err(|error| {
            error!("Unable to get user sessions: {}", error);
            AuthError::BackendError
        })
}

/// Handle delete user sessions
pub fn del_user_sessions<S>(
    state: &S,
) -> impl Filter<Extract = (impl Reply,), Error = Rejection> + Clone
where
    S: HasSecretKey + HasUserStorage + HasUserAuth + HasSessionStorage + Send + Sync + Clone,
    S::UserAuth: HasAccess<SessionArg, Grant>,
{
    let state = state.clone();

    warp::delete2()
        .and(warp::path::param::<UserId>()) // user id
        .and(warp::path("session"))
        .and(
            warp::path::param::<SessionId>()
                .map(Some)
                .or(any().map(|| None))
                .unify(),
        ) // session id
        .and(x_auth(&state))
        .and_then(|user, session, auth: S::UserAuth| {
            auth.access_to(&SessionArg { user }, &Grant::Delete)
                .map(|_| (user, session))
        }).untuple_one()
        .and_then(move |user, session| {
            del_user_sessions_fn(&state, user, session)
                .map_err(warp::reject::custom)
                .and_then(|res| {
                    res.map(|_| warp::reply())
                        .ok_or_else(warp::reject::not_found)
                })
        }).recover(AuthError::recover)
}

fn del_user_sessions_fn<S>(
    state: &S,
    user: UserId,
    session: Option<SessionId>,
) -> impl Future<Item = Option<()>, Error = AuthError>
where
    S: HasUserStorage + HasSessionStorage + HasUserAuth + Send + Sync + Clone,
{
    if let Some(session) = session {
        Either::A(
            (state.as_ref() as &S::SessionStorage)
                .del_user_session(user, session)
                .map_err(|error| {
                    error!("Unable to delete user sessions: {}", error);
                    AuthError::BackendError
                }),
        )
    } else {
        Either::B(
            (state.as_ref() as &S::SessionStorage)
                .del_user_sessions(user)
                .map_err(|error| {
                    error!("Unable to delete user sessions: {}", error);
                    AuthError::BackendError
                }).map(Some),
        )
    }
}

/// Scope with user auth handlers
pub fn auth_scope<S>(state: &S) -> impl Filter<Extract = (impl Reply,), Error = Rejection> + Clone
where
    S: HasPublicKey
        + HasSecretKey
        + HasUserAuth
        + HasUserStorage
        + HasSessionStorage
        + HasAuthMethod
        + Send
        + Sync
        + Clone,
    S::PublicKey: AsRef<PublicKey>,
    S::AuthMethod: IsAuthMethod<S>,
    S::UserAuth: HasAccess<SessionArg, Grant>,
    <S::UserStorage as IsUserStorage>::User: CanCreateView<S::UserAuth, SessionArg>,
    <S::SessionStorage as IsSessionStorage>::Session: From<SessionData>,
{
    get_auth_info(state)
        .or(do_user_auth(state))
        .or(get_user_sessions(state))
        .or(del_user_sessions(state))
}
