use base64;
use crypto::{random_bytes, PublicKey};
use std::collections::HashMap;
use std::time::Duration;
use timestamp::TimeStamp;

/// Unique user identifier
pub type UserId = u32;

/// Unique session indentifier
pub type SessionId = u32;

/// Public server data
///
/// The data which server publishes for clients,
/// and clients uses it to initiate authentication.
#[derive(Serialize)]
pub struct ServerData<AuthMethodData> {
    /// Current time of server
    pub time_stamp: TimeStamp,

    /// Public key of server
    #[serde(with = "base64")]
    pub public_key: PublicKey,

    /// Available auth methods with configs
    pub auth_method: HashMap<String, AuthMethodData>,
}

/// Authentication request
///
/// The request which client sends to server
/// to do authentication.
#[derive(Deserialize)]
pub struct AuthRequest<UserIdentData> {
    /// Current time of client synchronized to server
    pub time_stamp: TimeStamp,

    /// Public key of client
    #[serde(with = "base64")]
    pub public_key: PublicKey,

    /// Method-specific identification data
    ///
    /// Use #[serde(tag = "auth_method", content = "ident_data")]
    /// for `UserIdentData` enum.
    #[serde(flatten)]
    pub ident_data: UserIdentData,
}

/// Authentication response
///
/// The response which server sends to client
/// on success authentication.
#[derive(Serialize)]
pub struct AuthResponse<UserInfo> {
    pub user: UserId,

    pub session: SessionId,

    #[serde(with = "base64")]
    pub token: Vec<u8>,

    #[serde(flatten)]
    pub extra: UserInfo,
}

/// User session data
///
/// The data which stored on server
#[derive(Serialize, Deserialize)]
pub struct SessionData<ExtraData> {
    pub user: UserId,

    pub session: SessionId,

    pub public_key: PublicKey,

    pub token: Vec<u8>,

    pub serial: u32,

    pub ctime: TimeStamp,

    pub atime: TimeStamp,

    #[serde(flatten)]
    pub extra: ExtraData,
}

impl<ExtraData> SessionData<ExtraData> {
    /// Create new session data
    pub fn new(user: UserId, public_key: PublicKey) -> Self
    where
        ExtraData: Default,
    {
        let now = TimeStamp::now();
        Self {
            user,
            session: Default::default(),
            public_key,
            token: random_bytes(20),
            serial: 1,
            ctime: now,
            atime: now,
            extra: Default::default(),
        }
    }

    /// Check session outdating
    pub fn valid(&self, ttl: &Duration) -> bool {
        self.atime + *ttl > TimeStamp::now()
    }

    /// Refresh existing session data
    pub fn renew(&mut self) {
        self.serial += 1;
        self.atime = TimeStamp::now();
    }
}

/// User session info
///
/// The data which shows to client
#[derive(Serialize)]
pub struct SessionInfo<Extra> {
    pub user: UserId,

    pub session: SessionId,

    pub ctime: TimeStamp,

    pub atime: TimeStamp,

    #[serde(flatten)]
    pub extra: Extra,
}

impl<'a, ExtraData, ExtraInfo> From<&'a SessionData<ExtraData>> for SessionInfo<ExtraInfo>
where
    ExtraInfo: From<&'a ExtraData>,
{
    fn from(
        SessionData {
            user,
            session,
            ctime,
            atime,
            extra,
            ..
        }: &'a SessionData<ExtraData>,
    ) -> Self {
        Self {
            user: *user,
            session: *session,
            ctime: *ctime,
            atime: *atime,
            extra: extra.into(),
        }
    }
}

/// Authorization data
///
/// The data which client sends in `X-Auth` header
/// to do authorized requests.
#[derive(Deserialize)]
pub struct AuthData {
    pub user: UserId,

    pub session: SessionId,

    #[serde(with = "base64")]
    pub token: Vec<u8>,

    pub serial: u32,
}

impl<ExtraData> PartialEq<SessionData<ExtraData>> for AuthData {
    /// Validate
    fn eq(&self, other: &SessionData<ExtraData>) -> bool {
        self.serial == other.serial && self.token == other.token
    }
}
