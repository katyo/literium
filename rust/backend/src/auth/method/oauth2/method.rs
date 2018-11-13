use super::{
    AccessTokenResponse, AuthInfo, HasOAuth2Providers, IsOAuth2Providers, OAuth2Options,
    OAuth2State, ServiceInfo, UserIdent,
};
use auth::{AuthError, IsAuthMethod};
use futures::{
    future::{err, Either},
    Future,
};
use std::sync::Arc;
use user::{
    HasAccountAccess, HasUserAccess, IsAccountAccess, IsAccountData, IsUserAccess, IsUserData,
};
use {BoxFuture, CanDecrypt, CanEncrypt, CanUpdateFrom, HasHttpClient, HasSecureKey, IsHttpClient};

struct State {
    options: OAuth2Options,
}

/// OAuth2 auth method
#[derive(Clone)]
pub struct OAuth2Auth(Arc<State>);

impl OAuth2Auth {
    /// Create oauth2 auth method instance
    ///
    /// The client should be capable for HTTPS connections.
    pub fn new(options: OAuth2Options) -> Self {
        OAuth2Auth(Arc::new(State { options }))
    }
}

impl<S> IsAuthMethod<S> for OAuth2Auth
where
    S: HasUserAccess
        + HasAccountAccess
        + HasSecureKey
        + HasHttpClient
        + HasOAuth2Providers
        + Send
        + Clone
        + 'static,
    <S::UserAccess as IsUserAccess>::User:
        CanUpdateFrom<<S::AccountAccess as IsAccountAccess>::Account>,
{
    type AuthInfo = AuthInfo;
    type UserIdent = UserIdent;

    fn get_auth_info(&self, state: &S) -> Self::AuthInfo {
        let providers: &S::OAuth2Providers = state.as_ref();

        let service = self
            .0
            .options
            .service
            .iter()
            .filter(|opts| providers.has_service(&opts.service))
            .map(|opts| {
                providers
                    .prepare_authorize(&opts.service, &opts.params)
                    .map(|url| ServiceInfo {
                        name: opts.service.clone(),
                        url,
                    })
            }).filter(Result::is_ok)
            .map(Result::unwrap)
            .collect();

        let state_str = (state.as_ref() as &S::SecureKey)
            .seal_json_b64(&OAuth2State::new())
            .unwrap_or_else(|error| {
                error!("Unable to encrypt state: {}", error);
                "".into()
            });

        AuthInfo::OAuth2 {
            state: state_str,
            service,
        }
    }

    fn try_user_auth(
        &self,
        state: &S,
        UserIdent::OAuth2 {
            service,
            state: state_str,
            code,
        }: &Self::UserIdent,
    ) -> BoxFuture<<S::UserAccess as IsUserAccess>::User, AuthError> {
        match (state.as_ref() as &S::SecureKey).open_json_b64(&state_str) {
            Ok(OAuth2State { .. }) => (), // TODO: Add state checking
            Err(error) => {
                error!("Invalid OAuth2 state: {}", error);
                return Box::new(err(AuthError::BadIdent));
            }
        }

        let providers: &S::OAuth2Providers = state.as_ref();

        if !providers.has_service(&service) {
            return Box::new(err(AuthError::BadService));
        }

        let opts = if let Some(opts) = self
            .0
            .options
            .service
            .iter()
            .find(|opts| &opts.service == service)
        {
            opts
        } else {
            return Box::new(err(AuthError::BadService));
        };

        let (url, params) =
            match providers.prepare_access_token(&service, &opts.params, &state_str, &code) {
                Ok(res) => res,
                Err(error) => return Box::new(err(error)),
            };

        let client: &S::HttpClient = state.as_ref();

        use request::*;

        let service = service.clone();
        let state = state.clone();

        Box::new(
            client
                .fetch(Method(
                    "POST",
                    Url(
                        url.as_ref(),
                        Header(
                            "Content-Type",
                            "application/x-www-form-urlencoded",
                            Header(
                                "Accept",
                                "application/x-www-form-urlencoded",
                                RawBody(params),
                            ),
                        ),
                    ),
                )).map_err(|error| {
                    error!("Access token request error: {}", error);
                    AuthError::ServiceError
                }).map(UrlEncodedBody::into_inner)
                  .map(AccessTokenResponse::into_access_token)
                  .and_then(move |access_token| {
                      (state.as_ref() as &S::OAuth2Providers)
                          .fetch_user_info(&service, &state, access_token.into())
                          .and_then(move |mut data: <<S as HasAccountAccess>::AccountAccess as IsAccountAccess>::Account| {
                              // add service name to account
                              data.set_account_service(service.as_str());
                              (state.as_ref() as &S::AccountAccess)
                                  .find_user_account(&service, data.get_account_name())
                                  .map_err(|error| {
                                      error!("Error when finding user account: {}", error);
                                      AuthError::BackendError
                                  })
                                  .and_then(move |account| {
                                      if let Some(account) = account {
                                          // found => get user data
                                          data.set_account_id(account.get_account_id());
                                          Either::A(
                                              (state.as_ref() as &S::UserAccess)
                                                  .get_user_data(account.get_user_id())
                                                  .map_err(|error| {
                                                      error!("Error when getting user data: {}", error);
                                                      AuthError::BackendError
                                                  })
                                                  .and_then({
                                                      let state = state.clone();
                                                      move |user| {
                                                          if let Some(mut user) = user {
                                                              // update user info from account
                                                              user.update_from(&data);
                                                              // TODO: put only when something changed
                                                              Either::A((state.as_ref() as &S::UserAccess)
                                                                        .put_user_data(user)
                                                                        .map_err(|error| {
                                                                            error!("Error when putting user data: {}", error);
                                                                            AuthError::BackendError
                                                                        })
                                                                        .map(move |user| (data, user)))
                                                          } else {
                                                              Either::B(err(AuthError::BadUser))
                                                          }
                                                      }
                                                  })
                                          )
                                      } else {
                                          // not found => create user data
                                          let name = data.get_account_name().to_string() + "@" + &service;
                                          let mut user = <S::UserAccess as IsUserAccess>::User::create_new(name);
                                          // fill user info from account
                                          user.update_from(&data);
                                          Either::B(
                                              (state.as_ref() as &S::UserAccess)
                                                  .put_user_data(user)
                                                  .map_err(|error| {
                                                      error!("Error when putting user data: {}", error);
                                                      AuthError::BackendError
                                                  })
                                                  .map(move |user| {
                                                      // set user id to account data
                                                      data.set_user_id(user.get_user_id());
                                                      (data, user)
                                                  })
                                          )
                                      }.and_then(move |(account, user)| {
                                          // save account data
                                          // TODO: put only when something changed
                                          (state.as_ref() as &S::AccountAccess)
                                              .put_user_account(account)
                                              .map_err(|error| {
                                                  error!("Error when putting user account: {}", error);
                                                  AuthError::BackendError
                                              })
                                              .map(move |_| {
                                                  user
                                              })
                                      })
                                  })
                          })
                  })
        )
    }
}
