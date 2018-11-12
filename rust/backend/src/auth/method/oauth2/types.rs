use serde_extra::base64;

/// OAuth2 auth options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuth2Options {
    /// Supported services options
    pub service: Vec<ClientOptions>,
}

impl Default for OAuth2Options {
    fn default() -> Self {
        Self {
            service: Vec::new(),
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

/// OAuth2 auth metod information
#[derive(Debug, Serialize)]
pub enum AuthInfo {
    #[serde(rename = "oauth2")]
    OAuth2 {
        #[serde(with = "base64")]
        state: Vec<u8>,
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
pub struct AccessTokenParams<'a> {
    /// Provider params
    #[serde(flatten)]
    pub params: &'a ClientParams,
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
