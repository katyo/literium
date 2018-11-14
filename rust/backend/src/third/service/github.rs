/*!

## Github service integration and OAuth2 provider

See Github OAuth2 docs at https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/.

*/
use auth::oauth2::IsOAuth2Provider;
use base::{serde_extra::timestamp, wrappers::DisplayIter, BoxFuture, TimeStamp};
use futures::Future;
use http::{
    client::{HasHttpClient, IsHttpClient},
    request,
};
use std::borrow::Cow;
use std::fmt::{Display, Formatter, Result as FmtResult};
use third::{IsThirdService, ThirdApiParams, ThirdError};
use user::{
    HasAbout, HasCompany, HasCreateDate, HasEmail, HasFullName, HasHomeUrl, HasImageUrl,
    HasLocation, HasNickName, IsAccountData,
};

/// Github config
#[derive(Clone, Serialize, Deserialize)]
pub struct GithubConfig {
    #[serde(default = "default_scope")]
    pub scope: Vec<GithubScope>,

    #[serde(default = "default_allow_signup")]
    pub allow_signup: bool,
}

fn default_scope() -> Vec<GithubScope> {
    vec![GithubScope::ReadUser, GithubScope::UserEmail]
}

fn default_allow_signup() -> bool {
    true
}

fn is_default_allow_signup(v: &bool) -> bool {
    v == &true
}

impl Default for GithubConfig {
    fn default() -> Self {
        Self {
            scope: default_scope(),
            allow_signup: default_allow_signup(),
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

impl Display for GithubScope {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::GithubScope::*;
        f.write_str(match self {
            User => "user",
            ReadUser => "read:user",
            UserEmail => "user:email",
            UserFollow => "user:follow",
        })
    }
}

#[derive(Serialize)]
pub struct AuthorizeParams {
    #[serde(skip_serializing_if = "is_default_allow_signup")]
    allow_signup: bool,
}

/// Github service
pub struct GithubService(GithubConfig);

impl GithubService {
    pub fn new(config: GithubConfig) -> Self {
        GithubService(config)
    }
}

#[derive(Deserialize)]
struct GithubUserProfile {
    #[serde(default)]
    id: u64,
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
    #[serde(with = "timestamp::iso8601")]
    created_at: TimeStamp,
}

impl<S, A> IsThirdService<S, A> for GithubService
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
        use self::request::*;

        let client: &S::HttpClient = state.as_ref();

        Box::new(
            client
                .fetch(Method(
                    "GET",
                    UrlWithQuery(
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
                    let mut account = A::create_new(data.id.to_string());

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

impl<S, A> IsOAuth2Provider<S, A> for GithubService
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

    fn authorize_url(&self) -> Cow<str> {
        "https://github.com/login/oauth/authorize".into()
    }

    fn authorize_scope(&self) -> Cow<str> {
        DisplayIter::wrap(&self.0.scope)
            .separator(" ")
            .to_string()
            .into()
    }

    fn authorize_params(&self) -> Self::AuthorizeParams {
        AuthorizeParams {
            allow_signup: self.0.allow_signup,
        }
    }

    fn access_token_url(&self) -> Cow<'static, str> {
        "https://github.com/login/oauth/access_token".into()
    }
}
