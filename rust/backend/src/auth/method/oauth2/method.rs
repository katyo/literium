use super::{
    AccessTokenRequest, AccessTokenResponse, AuthInfo, HasOAuth2Providers, IsOAuth2Providers,
    OAuth2Options, ServiceInfo, UserIdent,
};
use auth::{AuthError, IsAuthMethod};
use base::{BoxFuture, CanUpdateFrom};
use futures::{
    future::{err, Either},
    Future,
};
use http::{
    client::{HasHttpClient, IsHttpClient},
    request,
};
use std::sync::Arc;
use user::{
    HasAccountStorage, HasUserStorage, IsAccountData, IsAccountStorage, IsUserData, IsUserStorage,
};

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
    S: HasUserStorage
        + HasAccountStorage
        + HasHttpClient
        + HasOAuth2Providers
        + Send
        + Clone
        + 'static,
    <S::UserStorage as IsUserStorage>::User:
        CanUpdateFrom<<S::AccountStorage as IsAccountStorage>::Account>,
{
    type AuthInfo = AuthInfo<
        ServiceInfo<
            <S::OAuth2Providers as IsOAuth2Providers<
                S,
                <S::AccountStorage as IsAccountStorage>::Account,
            >>::AuthorizeParams,
        >,
    >;
    type UserIdent = UserIdent;

    fn get_auth_info(&self, state: &S) -> Self::AuthInfo {
        let providers: &S::OAuth2Providers = state.as_ref();

        let services = self
            .0
            .options
            .services
            .iter()
            .filter(|opts| providers.has_service(&opts.name))
            .map(|opts| {
                let url = providers.authorize_url(&opts.name);
                let scope = providers.authorize_scope(&opts.name);
                let params = providers.authorize_params(&opts.name);

                ServiceInfo {
                    name: opts.name.clone(),
                    url: url.into(),
                    client_id: opts.params.client_id.clone(),
                    scope: scope.into(),
                    params,
                }
            }).collect();

        let redirect = self.0.options.redirect.clone();

        AuthInfo::OAuth2 { services, redirect }
    }

    fn try_user_auth(
        &self,
        state: &S,
        UserIdent::OAuth2 {
            name,
            code,
            state: state_val,
        }: &Self::UserIdent,
    ) -> BoxFuture<<S::UserStorage as IsUserStorage>::User, AuthError> {
        let providers: &S::OAuth2Providers = state.as_ref();

        if !providers.has_service(&name) {
            return Box::new(err(AuthError::BadService));
        }

        let opts = if let Some(opts) = self
            .0
            .options
            .services
            .iter()
            .find(|opts| &opts.name == name)
        {
            opts
        } else {
            return Box::new(err(AuthError::BadService));
        };

        let redirect_uri = self.0.options.redirect.to_string() + "/" + name;

        let url = providers.access_token_url(name);
        let query = AccessTokenRequest {
            params: &opts.params,
            code: code,
            redirect_uri: &redirect_uri,
            grant_type: "authorization_code",
            state: &state_val,
        };

        let client: &S::HttpClient = state.as_ref();

        use self::request::*;

        let name = name.clone();
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
                                UrlEncodedBody(query),
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
                          .fetch_user_info(&name, &state, access_token.into())
                          .and_then(move |mut data: <<S as HasAccountStorage>::AccountStorage as IsAccountStorage>::Account| {
                              // add service name to account
                              data.set_account_service(name.as_str());
                              (state.as_ref() as &S::AccountStorage)
                                  .find_user_account(&name, data.get_account_name())
                                  .map_err(|error| {
                                      error!("Error when finding user account: {}", error);
                                      AuthError::BackendError
                                  })
                                  .and_then(move |account| {
                                      if let Some(account) = account {
                                          // found => get user data
                                          data.set_account_id(account.get_account_id());
                                          Either::A(
                                              (state.as_ref() as &S::UserStorage)
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
                                                              Either::A((state.as_ref() as &S::UserStorage)
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
                                          let name = data.get_account_name().to_string() + "@" + &name;
                                          let mut user = <S::UserStorage as IsUserStorage>::User::create_new(name);
                                          // fill user info from account
                                          user.update_from(&data);
                                          Either::B(
                                              (state.as_ref() as &S::UserStorage)
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
                                          (state.as_ref() as &S::AccountStorage)
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
