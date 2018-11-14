/*!

## VKontakte service integration and OAuth2 provider

See VKontakte OAuth2 docs at https://vk.com/dev/authcode_flow_user.

*/
use auth::oauth2::IsOAuth2Provider;
use base::{wrappers::DisplayIter, BoxFuture, TimeStamp};
use futures::Future;
use http::{
    client::{HasHttpClient, IsHttpClient},
    request,
};
use std::borrow::Cow;
use std::fmt::{Display, Formatter, Result as FmtResult};
use third::{IsThirdService, ThirdApiParams, ThirdError};
use user::{
    Gender,
    HasAbout, HasBirthDate, HasCompany, HasEmail, HasFamilyName,
    HasGender, HasGivenName, HasHomeUrl, HasImageUrl, HasLocale, HasLocation, HasNickName,
    HasPosition, HasTimeZone, IsAccountData,
};

/// VK config
#[derive(Clone, Serialize, Deserialize)]
pub struct Config {
    /// Scope to use
    #[serde(default = "default_scope")]
    pub scope: Vec<Scope>,

    /// API version to use
    #[serde(default = "default_version")]
    pub version: String,

    /// Display of auth page
    #[serde(default)]
    pub display: DisplayKind,
}

fn default_scope() -> Vec<Scope> {
    vec![]
}

fn default_version() -> String {
    "5.87".into()
}

impl Default for Config {
    fn default() -> Self {
        Self {
            scope: default_scope(),
            version: default_version(),
            display: DisplayKind::default(),
        }
    }
}

/// VKontakte scope
///
/// TODO: Add other scopes
#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum Scope {
    /// Access to user email
    #[serde(rename = "email")]
    Email,
    /// Offline access to API
    #[serde(rename = "offline")]
    Offline,
}

impl Display for Scope {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::Scope::*;
        f.write_str(match self {
            Email => "email",
            Offline => "offline",
        })
    }
}

/// VKontakte display type
#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum DisplayKind {
    /// Dedicated page view
    #[serde(rename = "page")]
    Page,
    /// Popup view (default)
    #[serde(rename = "popup")]
    Popup,
    /// Mobile view
    #[serde(rename = "mobile")]
    Mobile,
}

impl Display for DisplayKind {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::DisplayKind::*;
        f.write_str(match self {
            Page => "page",
            Popup => "popup",
            Mobile => "mobile",
        })
    }
}

impl Default for DisplayKind {
    fn default() -> Self {
        DisplayKind::Popup
    }
}

/// Auth query params
#[derive(Serialize)]
pub struct AuthorizeParams {
    /// API version
    #[serde(rename = "v")]
    version: String,

    /// Display kind
    display: DisplayKind,
}

/// Vkontakte service
pub struct Service(Config);

impl Service {
    pub fn new(config: Config) -> Self {
        Service(config)
    }
}

#[derive(Serialize)]
struct UserGetRequest<'a> {
    /// API version to use
    #[serde(rename = "v")]
    version: &'a str,

    /// Requested fields
    fields: &'a str,
}

#[derive(Deserialize)]
struct UserGetResponse {
    id: u64,

    #[serde(default)]
    first_name: String,

    #[serde(default)]
    last_name: String,

    #[serde(default)]
    about: String,

    #[serde(default)]
    bdate: String,

    #[serde(default)]
    blacklisted: u8,

    #[serde(default)]
    career: Option<CareerInfo>,

    #[serde(default)]
    city: Option<CityInfo>,

    #[serde(default)]
    country: Option<CountryInfo>,

    #[serde(default)]
    domain: String,

    #[serde(default)]
    nickname: String,

    #[serde(default)]
    photo_100: String,

    #[serde(default)]
    sex: u8,

    #[serde(default)]
    site: String,

    #[serde(default)]
    personal: Option<PersonalInfo>,

    #[serde(default)]
    timezone: i32,
}

#[derive(Deserialize)]
struct CareerInfo {
    #[serde(default)]
    company: String,

    #[serde(default)]
    position: String,
}

#[derive(Deserialize)]
struct CityInfo {
    #[serde(default)]
    title: String,
}

#[derive(Deserialize)]
struct CountryInfo {
    #[serde(default)]
    title: String,
}

#[derive(Deserialize)]
struct PersonalInfo {
    #[serde(default)]
    langs: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct ApiError {
    code: u32,
    #[serde(rename = "type")]
    type_: String,
    description: String,
}

#[derive(Deserialize)]
enum ApiResponse<T> {
    #[serde(rename = "response")]
    Response(T),
    #[serde(rename = "error")]
    Error(ApiError),
}

impl<S, A> IsThirdService<S, A> for Service
where
    S: HasHttpClient,
    A: IsAccountData
        + HasNickName
        + HasGivenName
        + HasFamilyName
        + HasGender
        + HasBirthDate
        + HasTimeZone
        + HasLocation
        + HasCompany
        + HasPosition
        + HasEmail
        + HasImageUrl
        + HasHomeUrl
        + HasAbout
        + HasLocale
        + 'static,
{
    fn service_name(&self) -> Cow<str> {
        "vkontakte".into()
    }

    fn get_user_profile(&self, state: &S, access_token: Cow<str>) -> BoxFuture<A, ThirdError> {
        use self::request::*;

        let client: &S::HttpClient = state.as_ref();

        Box::new(
            client
                .fetch(Method(
                    "GET",
                    UrlWithQuery(
                        "https://api.vk.com/method/users.get",
                        ThirdApiParams::new(&access_token)
                            .with(UserGetRequest {
                                version: &self.0.version,
                                fields: "about,bdate,blacklisted,career,city,country,domain,nickname,photo_100,sex,site,timezone,personal"
                            }),
                        Header("Accept", "application/json", NoBody),
                    ),
                )).map_err(|error| {
                    error!("Error when fetching user profile: {}", error);
                    ThirdError::ServiceError
                }).map(JsonBody::into_inner)
                  .and_then(|resp: ApiResponse<Vec<UserGetResponse>>| {
                      match resp {
                          ApiResponse::Response(resp) => {
                              if let Some(data) = resp.into_iter().next() {
                                  Ok(data)
                              } else {
                                  error!("No user data returned");
                                  Err(ThirdError::ServiceError)
                              }
                          },
                          ApiResponse::Error(error) => {
                              error!("Unable to get user: {:?}", error);
                              Err(ThirdError::ServiceError)
                          },
                      }
                  })
                  .and_then(|data| {
                      if data.blacklisted == 1 {
                          Err(ThirdError::BadUser)
                      } else {
                          Ok(data)
                      }
                  })
                .map(|data| {
                    let mut account = A::create_new(data.id.to_string());

                    if !data.first_name.is_empty() {
                        account.set_given_name(Some(data.first_name));
                    }

                    if !data.last_name.is_empty() {
                        account.set_family_name(Some(data.last_name));
                    }

                    if !data.about.is_empty() {
                        account.set_about(Some(data.about));
                    }

                    if !data.bdate.is_empty() {
                        if let Ok(date) = TimeStamp::parse(&data.bdate, &"%d.%m.%Y") {
                            account.set_birth_date(Some(date));
                        } else if let Ok(date) = TimeStamp::parse(&data.bdate, &"%d.%m") {
                            account.set_birth_date(Some(date));
                        }
                    }

                    if let Some(data) = data.career {
                        if !data.company.is_empty() {
                            account.set_company(Some(data.company));
                        }
                        
                        if !data.position.is_empty() {
                            account.set_position(Some(data.position));
                        }
                    }

                    let location = match (data.country, data.city) {
                        (Some(c), Some(t)) => c.title + ", " + &t.title,
                        (Some(c), None) => c.title,
                        (None, Some(t)) => t.title,
                        _ => "".into()
                    };

                    if !location.is_empty() {
                        account.set_location(Some(location));
                    }

                    if !data.site.is_empty() {
                        if let Ok(url) = data.site.parse() {
                            account.set_home_url(Some(url));
                        }
                    } else if !data.domain.is_empty() {
                        if let Ok(url) = ("http://vk.com/".to_string() + &data.domain).parse() {
                            account.set_home_url(Some(url));
                        }
                    }

                    if !data.nickname.is_empty() {
                        account.set_nick_name(Some(data.nickname));
                    }

                    if !data.photo_100.is_empty() {
                        if let Ok(url) = data.photo_100.parse() {
                            account.set_image_url(Some(url));
                        }
                    }

                    match data.sex {
                        1 => account.set_gender(Some(Gender::Female)),
                        2 => account.set_gender(Some(Gender::Male)),
                        _ => (),
                    }

                    if let Some(data) = data.personal {
                        account.set_locale(Some(DisplayIter::wrap(&data.langs).separator(",").to_string()));
                    }

                    account.set_time_zone(Some(TimeStamp::default().with_mins(data.timezone)));

                    account
                }),
        )
    }
}

impl<S, A> IsOAuth2Provider<S, A> for Service
where
    A: IsAccountData
        + HasNickName
        + HasGivenName
        + HasFamilyName
        + HasGender
        + HasBirthDate
        + HasTimeZone
        + HasLocation
        + HasCompany
        + HasPosition
        + HasEmail
        + HasImageUrl
        + HasHomeUrl
        + HasAbout
        + HasLocale
        + 'static,
    S: HasHttpClient,
{
    type AuthorizeParams = AuthorizeParams;

    fn authorize_url(&self) -> Cow<str> {
        "https://oauth.vk.com/authorize".into()
    }

    fn authorize_scope(&self) -> Cow<str> {
        DisplayIter::wrap(&self.0.scope)
            .separator(",")
            .to_string()
            .into()
    }

    fn authorize_params(&self) -> Self::AuthorizeParams {
        AuthorizeParams {
            version: self.0.version.clone(),
            display: self.0.display,
        }
    }

    fn access_token_url(&self) -> Cow<str> {
        "https://oauth.vk.com/access_token".into()
    }
}
