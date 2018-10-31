use super::{
    AuthError, AuthInfo, AuthRequest, AuthResponse, HasAuthMethod, HasUserData, HasUserInfo,
    HasUserSession, IsAuthMethod, IsSessionData, IsUserData, SessionData,
};
use futures::{
    future::{err, Either},
    Future,
};
use serde::Serialize;
use warp::{Filter, Rejection, Reply};
use {reply, x_json, HasBackend, HasConfig, HasPublicKey, HasSecretKey, TimeStamp};

/// Handle get server auth data
pub fn get_auth_info<State>(
    state: State,
) -> impl Filter<Extract = (impl Reply,), Error = Rejection> + Clone
where
    State: HasConfig + HasBackend + Send + Sync + Clone + 'static,
    State::Config: HasPublicKey + HasAuthMethod,
    State::Backend: HasUserData,
    <State::Config as HasAuthMethod>::AuthMethod: IsAuthMethod<Backend = State::Backend>,
{
    warp::get2()
        .and_then(move || {
            get_auth_info_fn(state.clone())
                .map(|data| warp::reply::json(&data))
                .map_err(warp::reject::custom)
        }).recover(AuthError::recover)
}

fn get_auth_info_fn<State>(
    state: State,
) -> impl Future<
    Item = AuthInfo<<<State::Config as HasAuthMethod>::AuthMethod as IsAuthMethod>::AuthInfo>,
    Error = AuthError,
>
where
    State: HasConfig + HasBackend + Clone + 'static,
    State::Config: HasPublicKey + HasAuthMethod,
    State::Backend: HasUserData,
    <State::Config as HasAuthMethod>::AuthMethod: IsAuthMethod<Backend = State::Backend>,
{
    state
        .get_config()
        .get_auth_method()
        .get_auth_info(&state.get_backend())
        .map(move |info| AuthInfo::new(state.get_config().get_public_key().clone(), info))
}

/// Handle auth requests
pub fn do_user_auth<State>(
    state: State,
) -> impl Filter<Extract = (impl Reply,), Error = Rejection> + Clone
where
    State: HasConfig + HasBackend + Send + Sync + Clone + 'static,
    State::Config: HasPublicKey + HasSecretKey + HasAuthMethod,
    State::Backend: HasUserData + HasUserSession + HasUserInfo,
    <State::Config as HasAuthMethod>::AuthMethod: IsAuthMethod<Backend = State::Backend>,
    <State::Backend as HasUserInfo>::UserInfo: Serialize + Send,
    <State::Backend as HasUserSession>::SessionData: From<SessionData>,
{
    warp::post2()
        .and(x_json(state.clone()))
        .and_then(move |req| {
            do_user_auth_fn(state.clone(), req)
                .map(|data| reply::x_json(&data, state.clone()))
                .map_err(warp::reject::custom)
        }).recover(AuthError::recover)
}

fn do_user_auth_fn<State>(
    state: State,
    req: AuthRequest<<<State::Config as HasAuthMethod>::AuthMethod as IsAuthMethod>::UserIdent>,
) -> impl Future<Item = AuthResponse<<State::Backend as HasUserInfo>::UserInfo>, Error = AuthError>
where
    State: HasConfig + HasBackend + Send + Sync + Clone + 'static,
    State::Config: HasPublicKey + HasSecretKey + HasAuthMethod,
    State::Backend: HasUserData + HasUserSession + HasUserInfo,
    <State::Config as HasAuthMethod>::AuthMethod: IsAuthMethod<Backend = State::Backend>,
    <State::Backend as HasUserSession>::SessionData: From<SessionData>,
{
    if TimeStamp::now().abs_delta(&req.ctime) > TimeStamp::default().with_secs(3) {
        return Either::A(err(AuthError::Outdated));
    }

    let ctime = req.ctime;
    let pbkey = req.pbkey;

    Either::B(
        state
            .get_config()
            .get_auth_method()
            .try_user_auth(&state.get_backend(), &req.ident)
            .map_err(|error| {
                error!("Backend error on check_user_ident(): {}", error);
                AuthError::BackendError
            }).and_then(move |user| {
                state
                    .get_backend()
                    .find_user_session(user.user_id(), ctime)
                    .map_err(|error| {
                        error!("Backend error on find_user_session(): {}", error);
                        AuthError::BackendError
                    }).and_then(|_| Err(AuthError::Outdated))
                    .or_else(move |_| {
                        state
                            .get_backend()
                            .new_user_session(user.user_id(), pbkey)
                            .map_err(|error| {
                                error!("Backend error on new_user_session(): {}", error);
                                AuthError::BackendError
                            }).and_then(move |session| {
                                state
                                    .get_backend()
                                    .get_user_info(&user)
                                    .map_err(|error| {
                                        error!("Backend error on get_user_info(): {}", error);
                                        AuthError::BackendError
                                    }).map(move |extra| {
                                        let data = session.session_data();
                                        AuthResponse {
                                            user: user.user_id(),
                                            sess: data.sess,
                                            token: data.token.clone(),
                                            extra,
                                        }
                                    })
                            })
                    })
            }),
    )
}
