use base::{serde_extra::base64, TimeStamp};
use crypto::{random_bytes, PublicKey};
use std::time::Duration;
use user::UserId;

/// Unique session indentifier
pub type SessionId = u32;

/// Session arguments (or predicate)
#[derive(Debug)]
pub struct SessionArg {
    /// Session owner
    pub user: UserId,
}

/// Public server data
///
/// The data which server publishes for clients,
/// and clients uses it to initiate authentication.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthInfo<MethodInfo> {
    /// Current time of server
    pub ctime: TimeStamp,

    /// Public key of server
    #[serde(with = "base64")]
    pub pbkey: PublicKey,

    /// Available auth methods with configs
    ///
    /// This field must be represented as an externally tagged enum (which is default for serde),
    /// where tag is a method name and fields represents method info.
    pub authm: MethodInfo,
}

impl<MethodInfo> AuthInfo<MethodInfo> {
    pub fn new(pbkey: PublicKey, authm: MethodInfo) -> Self {
        Self {
            ctime: TimeStamp::now(),
            pbkey,
            authm,
        }
    }
}

/// Authentication request
///
/// The request which client sends to server to do authentication.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthRequest<UserIdent> {
    /// Current time of client synchronized to server
    pub ctime: TimeStamp,

    /// Public key of client
    #[serde(with = "base64")]
    pub pbkey: PublicKey,

    /// Method-specific identification data
    ///
    /// This field must be represented as an internally tagged enum (`#[serde(tag = "authm")]`),
    /// where tag is a method name and fields represents identification data.
    #[serde(flatten)]
    pub ident: UserIdent,
}

/// Authentication response
///
/// The response which server sends to client
/// on success authentication.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResponse<UserInfo> {
    /// Unique identifier of user
    pub user: UserId,

    /// Session identifier unique for user
    pub sess: SessionId,

    /// Unique session token for authorized requests
    #[serde(with = "base64")]
    pub token: Vec<u8>,

    /// Extra user data like name and roles
    ///
    /// It should be a struct because it will be flatten (merged with response).
    #[serde(flatten)]
    pub extra: UserInfo,
}

/// User session data
///
/// The data which stored on server
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionData {
    /// Unique user identifier
    pub user: UserId,

    /// Session identifier (unique for user)
    pub sess: SessionId,

    /// Client public key
    pub pbkey: PublicKey,

    /// Unique session token
    pub token: Vec<u8>,

    /// Last request serial number
    pub serno: u32,

    /// Session creation time
    pub ctime: TimeStamp,

    /// Last access time
    pub atime: TimeStamp,
}

impl SessionData {
    /// Create new session data
    ///
    /// Create new session data using user identifier and client public key
    pub fn new(user: UserId, pbkey: PublicKey) -> Self {
        let now = TimeStamp::now();
        Self {
            user,
            sess: Default::default(),
            pbkey,
            token: random_bytes(20),
            serno: 1,
            ctime: now,
            atime: now,
        }
    }

    /// Check session outdating
    pub fn valid(&self, ttl: &Duration) -> bool {
        self.atime + *ttl > TimeStamp::now()
    }

    /// Refresh existing session data
    pub fn renew(&mut self) {
        self.serno += 1;
        self.atime = TimeStamp::now();
    }
}

/// User session info
///
/// The data which shows to client
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    /// Unique identifier of user
    pub user: UserId,

    /// Session identifier unique for user
    pub sess: SessionId,

    /// Session creation time
    pub ctime: TimeStamp,

    /// Last access time
    pub atime: TimeStamp,
}

impl<'a> From<&'a SessionData> for SessionInfo {
    fn from(
        SessionData {
            user,
            sess,
            ctime,
            atime,
            ..
        }: &'a SessionData,
    ) -> Self {
        Self {
            user: *user,
            sess: *sess,
            ctime: *ctime,
            atime: *atime,
        }
    }
}

/// Authorization data
///
/// The data which client sends in `X-Auth` header
/// to do authorized requests.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthData {
    /// Unique user identifier
    pub user: UserId,

    /// Session identifier (unique for user)
    pub sess: SessionId,

    /// Unique session token
    #[serde(with = "base64")]
    pub token: Vec<u8>,

    /// Request serial number
    pub serno: u32,
}

impl PartialEq<SessionData> for AuthData {
    /// Validate
    fn eq(&self, other: &SessionData) -> bool {
        self.serno == other.serno && self.token == other.token
    }
}
