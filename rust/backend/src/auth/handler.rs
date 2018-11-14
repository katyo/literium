use super::{
    AuthError, AuthInfo, AuthRequest, AuthResponse, HasAuthMethod, HasSessionAccess, HasUserInfo,
    IsAuthMethod, IsSessionAccess, IsSessionData, IsUserInfo, SessionData,
};
use base::TimeStamp;
use crypto::{HasPublicKey, HasSecretKey, PublicKey};
use futures::{
    future::{err, Either},
    Future,
};
use serde::Serialize;
use user::{HasUserAccess, IsUserData};
use warp::{Filter, Rejection, Reply};
use {reply, x_json};

/// Handle get server auth data
pub fn get_auth_info<S>(state: S) -> impl Filter<Extract = (impl Reply,), Error = Rejection> + Clone
where
    S: HasPublicKey + HasUserAccess + HasAuthMethod + Send + Sync + Clone + 'static,
    S::PublicKey: AsRef<PublicKey>,
    S::AuthMethod: IsAuthMethod<S>,
{
    warp::get2().map(move || warp::reply::json(&get_auth_info_fn(state.clone())))
}

fn get_auth_info_fn<S>(state: S) -> AuthInfo<<S::AuthMethod as IsAuthMethod<S>>::AuthInfo>
where
    S: HasPublicKey + HasUserAccess + HasAuthMethod + Send + Sync + Clone + 'static,
    S::PublicKey: AsRef<PublicKey>,
    S::AuthMethod: IsAuthMethod<S>,
{
    AuthInfo::new(
        (state.as_ref() as &S::PublicKey).as_ref().clone(),
        (state.as_ref() as &S::AuthMethod).get_auth_info(&state),
    )
}

/// Handle auth requests
pub fn do_user_auth<S>(state: S) -> impl Filter<Extract = (impl Reply,), Error = Rejection> + Clone
where
    S: HasPublicKey
        + HasSecretKey
        + HasUserAccess
        + HasSessionAccess
        + HasUserInfo
        + HasAuthMethod
        + Send
        + Sync
        + Clone
        + 'static,
    S::AuthMethod: IsAuthMethod<S>,
    S::UserInfo: Serialize + Send,
    <S::SessionAccess as IsSessionAccess>::Session: From<SessionData>,
{
    warp::post2()
        .and(x_json(state.clone()))
        .and_then(move |req| {
            do_user_auth_fn(state.clone(), req)
                .map(|data| reply::x_json(data, state.clone()))
                .map_err(warp::reject::custom)
        }).recover(AuthError::recover)
}

fn do_user_auth_fn<S>(
    state: S,
    req: AuthRequest<<S::AuthMethod as IsAuthMethod<S>>::UserIdent>,
) -> impl Future<Item = AuthResponse<S::UserInfo>, Error = AuthError>
where
    S: HasSecretKey
        + HasUserAccess
        + HasSessionAccess
        + HasUserInfo
        + HasAuthMethod
        + Send
        + Sync
        + Clone
        + 'static,
    S::AuthMethod: IsAuthMethod<S>,
    S::UserInfo: Serialize + Send,
    <S::SessionAccess as IsSessionAccess>::Session: From<SessionData>,
{
    if TimeStamp::now().abs_delta(&req.ctime) > TimeStamp::default().with_secs(3) {
        return Either::A(err(AuthError::Outdated));
    }

    let ctime = req.ctime;
    let pbkey = req.pbkey;

    Either::B(
        (state.as_ref() as &S::AuthMethod)
            .try_user_auth(&state, &req.ident)
            .map_err(|error| {
                error!("Backend error on check_user_ident(): {}", error);
                AuthError::BackendError
            }).and_then(move |user| {
                (state.as_ref() as &S::SessionAccess)
                    .find_user_session(user.get_user_id(), ctime)
                    .map_err(|error| {
                        error!("Backend error on find_user_session(): {}", error);
                        AuthError::BackendError
                    }).and_then(|_| Err(AuthError::Outdated))
                    .or_else(move |_| {
                        (state.as_ref() as &S::SessionAccess)
                            .new_user_session(user.get_user_id(), pbkey)
                            .map_err(|error| {
                                error!("Backend error on new_user_session(): {}", error);
                                AuthError::BackendError
                            }).and_then(move |session| {
                                S::UserInfo::new_user_info(&state, &user)
                                    .map_err(|error| {
                                        error!("Backend error on get_user_info(): {}", error);
                                        AuthError::BackendError
                                    }).map(move |extra| {
                                        let data = session.session_data();
                                        AuthResponse {
                                            user: user.get_user_id(),
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
