use futures::{
    future::{err, Either},
    Future,
};

use auth::{
    AuthData, AuthError, HasSessionAccess, HasUserAccess, HasUserAuth, IsSessionData, IsUserAuth,
    SessionAccess, UserAccess,
};
use crypto::{open_x_json, HasSecretKey};
use warp::{any, header, reject::custom, Filter, Rejection};

/// Get user identification from header
///
/// Requests should contain base64 encoded sealed JSON auth data in `X-Auth` header.
///
/// This function extracts auth data, checks session and returns user data which can be used to check permissions and etc.
pub fn base64_sealed_auth<State>(
    state: State,
) -> impl Filter<Extract = (State::UserAuth,), Error = Rejection> + Clone
where
    State: HasSecretKey + HasUserAccess + HasSessionAccess + HasUserAuth + Send + Sync + Clone,
{
    let state = any().map(move || state.clone());

    any()
        .and(header("x-auth"))
        .and(state.clone())
        .and_then(|data: String, state: State| open_x_json(data, state.as_ref() as &State::KeyData))
        .and(state.clone())
        .and_then(|data: AuthData, state: State| {
            debug!("Received auth data: {:?}", data);
            (state.clone().as_ref() as &State::SessionAccess)
                .get_user_session(data.user, data.sess)
                .map_err(|_| AuthError::BackendError)
                .and_then(
                    move |session: Option<<State::SessionAccess as SessionAccess>::Session>| {
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
                            (state.as_ref() as &State::SessionAccess)
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
            |session: <State::SessionAccess as SessionAccess>::Session, state: State| {
                (state.clone().as_ref() as &State::UserAccess)
                    .get_user_data(session.session_data().user)
                    .map_err(|_| AuthError::BackendError)
                    .and_then(|user| {
                        user.map(move |user: <State::UserAccess as UserAccess>::User| {
                            State::UserAuth::new_user_auth(&session, &user)
                        }).ok_or_else(|| AuthError::BadUser)
                    }).map_err(custom)
            },
        )
}
