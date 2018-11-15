/*!

## Yandex service integration and OAuth2 provider

See Yandex OAuth2 docs at https://tech.yandex.ru/oauth/doc/dg/reference/auto-code-client-docpage/.

*/
use auth::oauth2::IsOAuth2Provider;
use base::{serde_extra::is_default, wrappers::DisplayIter, BoxFuture, TimeStamp};
use futures::Future;
use http::{
    client::{HasHttpClient, IsHttpClient},
    request,
};
use std::borrow::Cow;
use std::fmt::{Display, Formatter, Result as FmtResult};
use third::{IsThirdService, ThirdApiParams, ThirdError};
use user::{
    Gender, HasBirthDate, HasEmail, HasFamilyName, HasFullName, HasGender, HasGivenName,
    HasImageUrl, HasNickName, IsAccountData,
};

/// Yandex config
#[derive(Clone, Serialize, Deserialize)]
pub struct Config {
    /// Scope to use
    #[serde(default = "default_scope")]
    pub scope: Vec<Scope>,

    /// Force confirm
    #[serde(default)]
    pub force_confirm: bool,

    /// Optional scope to use
    #[serde(default = "default_optional_scope")]
    pub optional_scope: Vec<Scope>,
}

fn default_scope() -> Vec<Scope> {
    vec![Scope::LoginEmail]
}

fn default_optional_scope() -> Vec<Scope> {
    vec![]
}

impl Default for Config {
    fn default() -> Self {
        Self {
            scope: default_scope(),
            force_confirm: false,
            optional_scope: default_optional_scope(),
        }
    }
}

/// Yandex scope
///
/// TODO: Add other scopes
#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum Scope {
    /// Access to birthday of the user
    ///
    /// "login:birthday"
    #[serde(rename = "login:birthday")]
    LoginBirthday,

    /// Access to user emails
    ///
    /// "login:email"
    #[serde(rename = "login:email")]
    LoginEmail,

    /// Access to use info like a real name and gender
    ///
    /// "login:info"
    #[serde(rename = "login:info")]
    LoginInfo,

    /// Access to user avatar image
    ///
    /// "login:avatar"
    #[serde(rename = "login:avatar")]
    LoginAvatar,
}

impl Display for Scope {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::Scope::*;
        f.write_str(match self {
            LoginBirthday => "login:birthday",
            LoginEmail => "login:email",
            LoginInfo => "login:info",
            LoginAvatar => "login:avatar",
        })
    }
}

#[derive(Serialize)]
pub struct AuthorizeParams {
    /// Force confirm
    #[serde(skip_serializing_if = "is_default")]
    pub force_confirm: bool,

    /// Optional scope to use
    #[serde(default = "String::is_empty")]
    pub optional_scope: String,
}

/// Yandex service
pub struct Service(Config);

impl Service {
    pub fn new(config: Config) -> Self {
        Service(config)
    }
}

#[derive(Deserialize)]
struct UserProfile {
    #[serde(default)]
    id: String,
    #[serde(default)]
    login: String,
    #[serde(default)]
    default_email: String,
    #[serde(default)]
    emails: Vec<String>,
    #[serde(default)]
    is_avatar_empty: bool,
    #[serde(default)]
    default_avatar_id: String,
    #[serde(default)]
    birthday: String,
    #[serde(default)]
    first_name: String,
    #[serde(default)]
    last_name: String,
    #[serde(default)]
    display_name: String,
    #[serde(default)]
    real_name: String,
    #[serde(default)]
    sex: Option<Gender>,
}

impl<S, A> IsThirdService<S, A> for Service
where
    S: HasHttpClient,
    A: IsAccountData
        + HasNickName
        + HasFullName
        + HasGivenName
        + HasFamilyName
        + HasBirthDate
        + HasEmail
        + HasImageUrl
        + HasGender
        + 'static,
{
    fn service_name(&self) -> Cow<str> {
        "yandex".into()
    }

    fn get_user_profile(&self, state: &S, access_token: Cow<str>) -> BoxFuture<A, ThirdError> {
        use self::request::*;

        let client: &S::HttpClient = state.as_ref();

        Box::new(
            client
                .fetch(Method(
                    "GET",
                    UrlWithQuery(
                        "https://login.yandex.ru/info",
                        ThirdApiParams::new(&access_token),
                        Header(
                            "Authorization",
                            format!("OAuth {}", access_token),
                            Header("Accept", "application/json", NoBody),
                        ),
                    ),
                )).map_err(|error| {
                    error!("Error when fetching user profile: {}", error);
                    ThirdError::ServiceError
                }).map(JsonBody::into_inner)
                .map(|data: UserProfile| {
                    let mut account = A::create_new(data.id);

                    account.set_nick_name(Some(data.login));

                    if !data.real_name.is_empty() {
                        account.set_full_name(Some(data.real_name));
                    }

                    if !data.first_name.is_empty() {
                        account.set_given_name(Some(data.first_name));
                    } else if !data.display_name.is_empty() {
                        account.set_given_name(Some(data.display_name));
                    }

                    if !data.last_name.is_empty() {
                        account.set_family_name(Some(data.last_name));
                    }

                    account.set_gender(data.sex);

                    if !data.birthday.is_empty() {
                        if let Ok(date) = TimeStamp::parse(&data.birthday, &"%Y-%m-%d") {
                            account.set_birth_date(Some(date));
                        }
                    }

                    if !data.default_email.is_empty() {
                        if let Ok(email) = data.default_email.parse() {
                            account.set_email(Some(email));
                        }
                    } else if !data.emails.is_empty() {
                        for email in &data.emails {
                            if let Ok(email) = email.parse() {
                                account.set_email(Some(email));
                                break;
                            }
                        }
                    }

                    if !data.is_avatar_empty && !data.default_avatar_id.is_empty() {
                        let avatar_url = format!(
                            "https://avatars.yandex.net/get-yapic/{}/{}",
                            data.default_avatar_id, "islands-retina-50"
                        );
                        if let Ok(url) = avatar_url.parse() {
                            account.set_image_url(Some(url));
                        }
                    }

                    account
                }),
        )
    }
}

impl<S, A> IsOAuth2Provider<S, A> for Service
where
    S: HasHttpClient,
    A: IsAccountData
        + HasNickName
        + HasFullName
        + HasGivenName
        + HasFamilyName
        + HasBirthDate
        + HasEmail
        + HasImageUrl
        + HasGender
        + 'static,
{
    type AuthorizeParams = AuthorizeParams;

    fn authorize_url(&self) -> Cow<'static, str> {
        "https://oauth.yandex.ru/authorize".into()
    }

    fn authorize_scope(&self) -> Cow<str> {
        DisplayIter::wrap(&self.0.scope)
            .separator(" ")
            .to_string()
            .into()
    }

    fn authorize_params(&self) -> Self::AuthorizeParams {
        AuthorizeParams {
            force_confirm: self.0.force_confirm,
            optional_scope: DisplayIter::wrap(&self.0.optional_scope)
                .separator(" ")
                .to_string(),
        }
    }

    fn access_token_url(&self) -> Cow<'static, str> {
        "https://oauth.yandex.ru/token".into()
    }
}
