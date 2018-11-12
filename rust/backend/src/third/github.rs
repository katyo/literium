use super::{IsThirdService, ThirdApiParams, ThirdError};
use auth::method::IsOAuth2Provider;
use futures::Future;
use serde_extra;
use std::borrow::Cow;
use user::{
    HasAbout, HasCompany, HasCreateDate, HasEmail, HasFullName, HasHomeUrl, HasImageUrl,
    HasLocation, HasNickName, IsAccountData,
};
use {BoxFuture, HasHttpClient, IsHttpClient, TimeStamp};

/// Github config
#[derive(Clone, Serialize, Deserialize)]
pub struct GithubConfig {
    pub scope: Vec<GithubScope>,
}

impl Default for GithubConfig {
    fn default() -> Self {
        Self {
            scope: vec![GithubScope::ReadUser, GithubScope::UserEmail],
        }
    }
}

/// Github scope
///
/// TODO: Add other scopes
#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum GithubScope {
    /// Grants read/write access to profile info only
    ///
    /// Note that this scope includes `user:email` and `user:follow`.
    #[serde(rename = "user")]
    User,
    /// Grants access to read a user's profile data (`read:user`)
    #[serde(rename = "read:user")]
    ReadUser,
    /// Grants read access to a user's email addresses (`user:email`)
    #[serde(rename = "user:email")]
    UserEmail,
    /// Grants access to follow or unfollow other users (`user:follow`)
    #[serde(rename = "user:follow")]
    UserFollow,
}

#[derive(Clone, Serialize)]
pub struct AuthorizeParams {
    #[serde(default)]
    #[serde(with = "serde_extra::space_delim_string")]
    pub scope: Vec<GithubScope>,
}

/// Github OAuth2 provider
pub struct OAuth2Github(GithubConfig);

impl OAuth2Github {
    pub fn new(config: GithubConfig) -> Self {
        OAuth2Github(config)
    }
}

#[derive(Deserialize)]
struct GithubUserProfile {
    #[serde(default)]
    login: String,
    #[serde(default)]
    avatar_url: String,
    #[serde(default)]
    html_url: String,
    #[serde(default)]
    name: String,
    #[serde(default)]
    company: String,
    #[serde(default)]
    blog: String,
    #[serde(default)]
    location: String,
    #[serde(default)]
    email: String,
    #[serde(default)]
    bio: String,
    #[serde(default)]
    #[serde(with = "serde_extra::timestamp_iso8601")]
    created_at: TimeStamp,
}

impl<S, A> IsThirdService<S, A> for OAuth2Github
where
    S: HasHttpClient,
    A: IsAccountData
        + HasNickName
        + HasFullName
        + HasCreateDate
        + HasLocation
        + HasEmail
        + HasImageUrl
        + HasHomeUrl
        + HasCompany
        + HasAbout
        + 'static,
{
    fn service_name(&self) -> Cow<str> {
        "github".into()
    }

    fn get_user_profile(&self, state: &S, access_token: Cow<str>) -> BoxFuture<A, ThirdError> {
        use request::*;

        let client: &S::HttpClient = state.as_ref();

        Box::new(
            client
                .fetch(Method(
                    "GET",
                    UrlParams(
                        "https://api.github.com/user",
                        ThirdApiParams {
                            access_token: &access_token,
                        },
                        Header("Accept", "application/json", NoBody),
                    ),
                )).map_err(|error| {
                    error!("Error when fetching user profile: {}", error);
                    ThirdError::ServiceError
                }).map(JsonBody::into_inner)
                .map(|data: GithubUserProfile| {
                    let mut account = A::create_new(data.login.clone());

                    account.set_nick_name(Some(data.login));

                    if !data.name.is_empty() {
                        account.set_full_name(Some(data.name));
                    }

                    account.set_create_date(Some(data.created_at));

                    if !data.location.is_empty() {
                        account.set_location(Some(data.location));
                    }

                    if !data.email.is_empty() {
                        if let Ok(email) = data.email.parse() {
                            account.set_email(Some(email));
                        }
                    }

                    if !data.avatar_url.is_empty() {
                        if let Ok(url) = data.avatar_url.parse() {
                            account.set_image_url(Some(url));
                        }
                    }

                    if !data.blog.is_empty() {
                        if let Ok(url) = data.blog.parse() {
                            account.set_home_url(Some(url));
                        }
                    } else if !data.html_url.is_empty() {
                        if let Ok(url) = data.html_url.parse() {
                            account.set_home_url(Some(url));
                        }
                    }

                    if !data.company.is_empty() {
                        account.set_company(Some(data.company));
                    }

                    if !data.bio.is_empty() {
                        account.set_about(Some(data.bio));
                    }

                    account
                }),
        )
    }
}

impl<S, A> IsOAuth2Provider<S, A> for OAuth2Github
where
    A: IsAccountData
        + HasNickName
        + HasFullName
        + HasCreateDate
        + HasLocation
        + HasEmail
        + HasImageUrl
        + HasHomeUrl
        + HasCompany
        + HasAbout
        + 'static,
    S: HasHttpClient,
{
    type AuthorizeParams = AuthorizeParams;

    fn authorize_url(&self) -> Cow<'static, str> {
        "https://github.com/login/oauth/authorize".into()
    }

    fn authorize_params(&self) -> Self::AuthorizeParams {
        AuthorizeParams {
            scope: self.0.scope.clone(),
        }
    }

    fn access_token_url(&self) -> Cow<'static, str> {
        "https://github.com/login/oauth/access_token".into()
    }
}
