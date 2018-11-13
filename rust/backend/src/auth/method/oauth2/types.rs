use serde_extra::base64;
use serde_with::rust::display_fromstr;
use url::Url;
use {random_bytes, TimeStamp};

/// OAuth2 auth options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuth2Options {
    /// Supported services options
    pub service: Vec<ClientOptions>,
    /// Redirect URI
    ///
    /// The service name will be added to this URI to get `redirect_uri` parameter.
    #[serde(with = "display_fromstr")]
    pub redirect: Url,
}

impl Default for OAuth2Options {
    fn default() -> Self {
        Self {
            service: Vec::new(),
            redirect: "https://my-site.tld/oauth2".parse().unwrap(),
        }
    }
}

/// OAuth2 client options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientOptions {
    /// Service name
    pub service: String,
    /// Client params
    #[serde(flatten)]
    pub params: ClientParams,
}

/// OAuth2 client parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientParams {
    /// Client identifier
    pub client_id: String,
    /// Client secret
    pub client_secret: String,
}

/// OAuth2 state params
#[derive(Serialize, Deserialize)]
pub struct OAuth2State {
    /// Creating time
    pub ctime: TimeStamp,
    /// Random token
    #[serde(with = "base64")]
    pub token: Vec<u8>,
}

impl OAuth2State {
    pub fn new() -> Self {
        Self {
            ctime: TimeStamp::now(),
            token: random_bytes(12),
        }
    }
}

/// OAuth2 auth metod information
#[derive(Debug, Serialize)]
pub enum AuthInfo {
    #[serde(rename = "oauth2")]
    OAuth2 {
        /// Unguessable state string
        state: String,
        /// Service params
        service: Vec<ServiceInfo>,
    },
}

/// OAuth2 auth service information
#[derive(Debug, Serialize)]
pub struct ServiceInfo {
    /// String name of service
    ///
    /// github, google, ...etc.
    pub name: String,
    /// Authorize endpoint url
    ///
    /// A full url with parameters but without state
    pub url: String,
}

/// OAuth2 auth user identification
#[derive(Debug, Deserialize)]
pub enum UserIdent {
    #[serde(rename = "oauth2")]
    OAuth2 {
        #[serde(flatten)]
        /// OAuth2 service name
        service: String,
        /// Unguessable state string
        state: String,
        /// OAuth2 authorization code
        code: String,
    },
}

/// OAuth2 authorize request params
#[derive(Debug, Clone, Serialize)]
pub struct AuthorizeParams<'a, T> {
    /// Client identifier
    pub client_id: &'a str,
    /// Service-specific params
    pub params: T,
}

/// OAuth2 access token request params
#[derive(Debug, Clone, Serialize)]
pub struct AccessTokenRequest<'a> {
    /// Provider params
    #[serde(flatten)]
    pub params: &'a ClientParams,
    /// State string
    pub state: &'a str,
    /// Auth code
    pub code: &'a str,
}

/// OAuth2 access token response params
#[derive(Debug, Clone, Deserialize)]
pub struct AccessTokenResponse {
    /// Access token
    pub access_token: String,
}

impl AccessTokenResponse {
    /// Unwrap access token
    pub fn into_access_token(self) -> String {
        self.access_token
    }
}
