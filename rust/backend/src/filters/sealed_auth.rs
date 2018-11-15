use futures::{
    future::{err, result, Either},
    Future,
};

use auth::{
    AuthData, AuthError, HasSessionAccess, HasUserAuth, IsSessionAccess, IsSessionData, IsUserAuth,
};
use crypto::{CanDecrypt, HasSecretKey};
use user::{HasUserAccess, IsUserAccess};
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
    State: HasSecretKey + HasUserAccess + HasSessionAccess + HasUserAuth + Send + Clone,
{
    let state = state.clone();
    header("x-auth")
        .map(|auth: String| Some(auth))
        .or(any().map(|| None))
        .unify()
        .and_then(move |auth: Option<String>| {
            auth.map(|auth| Either::A(proc_user_auth(state.clone(), auth)))
                .unwrap_or_else(|| {
                    Either::B(result(
                        State::UserAuth::new_none_auth().ok_or_else(|| AuthError::MissingAuth),
                    ))
                }).map_err(custom)
        })
}

fn proc_user_auth<State>(
    state: State,
    auth: String,
) -> impl Future<Item = State::UserAuth, Error = AuthError> + Send
where
    State: HasSecretKey + HasUserAccess + HasSessionAccess + HasUserAuth + Send + Clone,
{
    result(
        (state.as_ref() as &State::SecretKey)
            .open_json_b64(auth)
            .map_err(|error| {
                error!("Error when openning auth data: {:?}", error);
                AuthError::BadAuth
            }),
    ).and_then({
        let state = state.clone();
        move |data: AuthData| {
            debug!("Received auth data: {:?}", data);

            (state.as_ref() as &State::SessionAccess)
                .get_user_session(data.user, data.sess)
                .map_err(|error| {
                    error!("Error when getting user session: {}", error);
                    AuthError::BackendError
                }).map(
                    move |session: Option<<State::SessionAccess as IsSessionAccess>::Session>| {
                        (data, session)
                    },
                )
        }
    }).and_then({
        let state = state.clone();
        move |(data, session)| {
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
        }
    }).and_then({
        move |session: <State::SessionAccess as IsSessionAccess>::Session| {
            (state.clone().as_ref() as &State::UserAccess)
                .get_user_data(session.session_data().user)
                .map_err(|_| AuthError::BackendError)
                .and_then(|user| {
                    user.map(move |user: <State::UserAccess as IsUserAccess>::User| {
                        State::UserAuth::new_user_auth(&session, &user)
                    }).ok_or_else(|| AuthError::BadUser)
                })
        }
    })
}
