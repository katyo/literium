use futures::{
    future::{err, Either},
    Future,
};

use auth::{AuthData, AuthError, HasUserAuth, HasUserData, HasUserSession, IsSessionData};
use crypto::{decrypt_base64_sealed_json, HasPublicKey, HasSecretKey};
use warp::{any, header, reject::custom, Filter, Rejection};
use {HasBackend, HasConfig};

/// Get user identification from header
///
/// Requests should contain base64 encoded sealed JSON auth data in `X-Auth` header.
///
/// This function extracts auth data, checks session and returns user data which can be used to check permissions and etc.
pub fn base64_sealed_auth<State>(
    state: State,
) -> impl Filter<Extract = (<State::Backend as HasUserAuth>::AuthData,), Error = Rejection> + Clone
where
    State: HasBackend + HasConfig + Send + Sync + Clone,
    State::Config: HasPublicKey + HasSecretKey,
    State::Backend: HasUserSession + HasUserData + HasUserAuth,
    <State::Backend as HasUserAuth>::AuthData: Send,
{
    let state = any().map(move || state.clone());

    any()
        .and(header("x-auth"))
        .and(state.clone())
        .and_then(|data: String, state: State| decrypt_base64_sealed_json(data, state.get_config()))
        .and(state.clone())
        .and_then(|data: AuthData, state: State| {
            debug!("Received auth data: {:?}", data);
            state
                .clone()
                .get_backend()
                .get_user_session(data.user, data.sess)
                .map_err(|_| AuthError::BackendError)
                .and_then(
                    move |session: Option<<State::Backend as HasUserSession>::SessionData>| {
                        let mut session = if let Some(session) = session {
                            session
                        } else {
                            error!("Lost session");
                            return Either::A(err(AuthError::LostSession));
                        };
                        //if !session.valid(Duration::from_secs(5 * 24 * 60 * 60)) {
                        //
                        //}
                        if &data != session.session_data() {
                            error!("Bad session");
                            return Either::A(err(AuthError::BadSession));
                        }
                        session.session_data_mut().renew();
                        Either::B(
                            state
                                .get_backend()
                                .put_user_session(session)
                                .map_err(|error| {
                                    error!("Backend error: {}", error);
                                    AuthError::BackendError
                                }),
                        )
                    },
                ).map_err(custom)
        }).and(state)
        .and_then(
            |session: <State::Backend as HasUserSession>::SessionData, state: State| {
                state
                    .clone()
                    .get_backend()
                    .get_user_data(session.session_data().user)
                    .map_err(|_| AuthError::BackendError)
                    .and_then(|user| {
                        user.map(move |user: <State::Backend as HasUserData>::UserData| {
                            state.get_backend().get_auth_data(&session, &user)
                        }).ok_or_else(|| AuthError::BadUser)
                    }).map_err(custom)
            },
        )
}
