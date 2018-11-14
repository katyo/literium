use serde_with::rust::display_fromstr;
use url::Url;

/// OAuth2 auth options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuth2Options {
    /// Supported services options
    pub services: Vec<ClientOptions>,
    /// Redirect URI
    ///
    /// The service name will be added to this URI to get `redirect_uri` parameter.
    #[serde(with = "display_fromstr")]
    pub redirect: Url,
}

impl Default for OAuth2Options {
    fn default() -> Self {
        Self {
            services: Vec::new(),
            redirect: "https://my-site.tld/oauth2".parse().unwrap(),
        }
    }
}

/// OAuth2 client options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientOptions {
    /// Service name
    pub name: String,

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
pub enum AuthInfo<ServiceInfo> {
    #[serde(rename = "oauth2")]
    OAuth2 {
        /// Service params
        services: Vec<ServiceInfo>,
        /// Redirect URI
        ///
        /// The service name will be added to this URI to get `redirect_uri` parameter.
        #[serde(with = "display_fromstr")]
        redirect: Url,
    },
}

/// OAuth2 auth service information
#[derive(Debug, Serialize)]
pub struct ServiceInfo<Params> {
    /// String name of service
    ///
    /// github, google, ...etc.
    pub name: String,

    /// Authorize endpoint URL
    ///
    /// A full url with parameters but without state
    pub url: String,

    /// Client identifier
    ///
    /// Sets from service options
    pub client_id: String,

    /// Scope
    pub scope: String,

    /// Extra params
    #[serde(flatten)]
    pub params: Params,
}

/// OAuth2 auth user identification
#[derive(Debug, Deserialize)]
pub enum UserIdent {
    #[serde(rename = "oauth2")]
    OAuth2 {
        #[serde(flatten)]
        /// Service name
        name: String,

        /// Authorization code
        code: String,

        /// State string
        ///
        /// Some services need this.
        state: String,
    },
}

/// OAuth2 access token request params
#[derive(Debug, Clone, Serialize)]
pub struct AccessTokenRequest<'a> {
    /// Provider params
    #[serde(flatten)]
    pub params: &'a ClientParams,

    /// Auth code
    pub code: &'a str,

    /// Redirect uri
    pub redirect_uri: &'a str,

    /// Grant type
    ///
    /// Some services need this.
    ///
    /// Should be set to "autorization_code".
    pub grant_type: &'a str,

    /// State
    ///
    /// Some services need this.
    pub state: &'a str,
}

/// OAuth2 access token response params
#[derive(Debug, Clone, Deserialize)]
pub struct AccessTokenResponse {
    /// Access token
    pub access_token: String,

    /// Refresh token
    pub refresh_token: Option<String>,

    /// Expires in
    ///
    /// The remaining lifetime of the access token in seconds.
    pub expires_in: Option<u32>,
}

impl AccessTokenResponse {
    /// Unwrap access token
    pub fn into_access_token(self) -> String {
        self.access_token
    }
}
