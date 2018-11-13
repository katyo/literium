use auth::oauth2::IsOAuth2Provider;
use futures::Future;
use serde_with::{rust::StringWithSeparator, SpaceSeparator};
use std::borrow::Cow;
use std::fmt::{Display, Formatter, Result as FmtResult};
use third::{IsThirdService, ThirdApiParams, ThirdError};
use user::{
    HasEmail, HasFamilyName, HasFullName, HasGender, HasGivenName, HasHomeUrl, HasImageUrl,
    HasLocale, IsAccountData,
};
use {BoxFuture, HasHttpClient, IsHttpClient};

/// Google config
#[derive(Clone, Serialize, Deserialize)]
pub struct GoogleConfig {
    pub scope: Vec<GoogleScope>,
}

impl Default for GoogleConfig {
    fn default() -> Self {
        Self {
            scope: vec![GoogleScope::UserInfoProfile, GoogleScope::UserInfoEmail],
        }
    }
}

/// Google scope
///
/// TODO: Add other scopes
#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum GoogleScope {
    /// Know the list of people in your circles, your age range, and language
    ///
    /// `https://www.googleapis.com/auth/plus.login`
    #[serde(rename = "plus.login")]
    PlusLogin,
    /// Know who you are on Google
    ///
    /// `https://www.googleapis.com/auth/plus.me`
    #[serde(rename = "plus.me")]
    PlusMe,
    /// View your email address
    ///
    /// `https://www.googleapis.com/auth/userinfo.email	`
    #[serde(rename = "userinfo.email	")]
    UserInfoEmail,
    /// View your basic profile info
    ///
    /// `https://www.googleapis.com/auth/userinfo.profile`
    #[serde(rename = "userinfo.profile")]
    UserInfoProfile,
}

impl Display for GoogleScope {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::GoogleScope::*;
        f.write_str(match self {
            PlusLogin => "https://www.googleapis.com/auth/plus.login",
            PlusMe => "https://www.googleapis.com/auth/plus.me",
            UserInfoEmail => "https://www.googleapis.com/auth/userinfo.email",
            UserInfoProfile => "https://www.googleapis.com/auth/userinfo.profile",
        })
    }
}

#[derive(Clone, Serialize)]
pub struct AuthorizeParams {
    #[serde(with = "StringWithSeparator::<SpaceSeparator>")]
    pub scope: Vec<GoogleScope>,
}

/// Google servide
pub struct GoogleService(GoogleConfig);

impl GoogleService {
    pub fn new(config: GoogleConfig) -> Self {
        GoogleService(config)
    }
}

#[derive(Deserialize)]
struct GoogleUserProfile {
    id: String,
    #[serde(default)]
    email: String,
    #[serde(default)]
    name: String,
    #[serde(default)]
    given_name: String,
    #[serde(default)]
    family_name: String,
    #[serde(default)]
    link: String,
    #[serde(default)]
    picture: String,
    #[serde(default)]
    gender: String,
    #[serde(default)]
    locale: String,
}

impl<S, A> IsThirdService<S, A> for GoogleService
where
    S: HasHttpClient,
    A: IsAccountData
        + HasFullName
        + HasGivenName
        + HasFamilyName
        + HasGender
        + HasLocale
        + HasEmail
        + HasImageUrl
        + HasHomeUrl
        + 'static,
{
    fn service_name(&self) -> Cow<str> {
        "google".into()
    }

    fn get_user_profile(&self, state: &S, access_token: Cow<str>) -> BoxFuture<A, ThirdError> {
        use request::*;

        let client: &S::HttpClient = state.as_ref();

        Box::new(
            client
                .fetch(Method(
                    "GET",
                    UrlParams(
                        "https://www.googleapis.com/oauth2/v2/userinfo",
                        ThirdApiParams {
                            access_token: &access_token,
                        },
                        Header("Accept", "application/json", NoBody),
                    ),
                )).map_err(|error| {
                    error!("Error when fetching user profile: {}", error);
                    ThirdError::ServiceError
                }).map(JsonBody::into_inner)
                .map(|data: GoogleUserProfile| {
                    let mut account = A::create_new(data.id);

                    if !data.name.is_empty() {
                        account.set_full_name(Some(data.name));
                    }

                    if !data.given_name.is_empty() {
                        account.set_given_name(Some(data.given_name));
                    }

                    if !data.family_name.is_empty() {
                        account.set_family_name(Some(data.family_name));
                    }

                    if !data.gender.is_empty() {
                        if let Ok(gender) = data.gender.parse() {
                            account.set_gender(Some(gender));
                        }
                    }

                    if !data.locale.is_empty() {
                        account.set_locale(Some(data.locale));
                    }

                    if !data.email.is_empty() {
                        if let Ok(email) = data.email.parse() {
                            account.set_email(Some(email));
                        }
                    }

                    if !data.picture.is_empty() {
                        if let Ok(url) = data.picture.parse() {
                            account.set_image_url(Some(url));
                        }
                    }

                    if !data.link.is_empty() {
                        if let Ok(url) = data.link.parse() {
                            account.set_home_url(Some(url));
                        }
                    }

                    account
                }),
        )
    }
}

impl<S, A> IsOAuth2Provider<S, A> for GoogleService
where
    A: IsAccountData
        + HasFullName
        + HasGivenName
        + HasFamilyName
        + HasGender
        + HasLocale
        + HasEmail
        + HasImageUrl
        + HasHomeUrl
        + 'static,
    S: HasHttpClient,
{
    type AuthorizeParams = AuthorizeParams;

    fn authorize_url(&self) -> Cow<'static, str> {
        "https://accounts.google.com/o/oauth2/auth".into()
    }

    fn authorize_params(&self) -> Self::AuthorizeParams {
        AuthorizeParams {
            scope: self.0.scope.clone(),
        }
    }

    fn access_token_url(&self) -> Cow<'static, str> {
        "https://accounts.google.com/o/oauth2/token".into()
    }
}
