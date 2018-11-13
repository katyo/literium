use std::borrow::Cow;
use std::ops::RangeInclusive;
use user::{gen_password, ARABIC_NUMBERS_AND_LATIN_LETTERS};
use TimeStamp;

/// One-time password auth options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OTPassOptions {
    /// Password length in chars
    pub pass_size: usize,
    /// Password dictionary
    pub pass_dict: Cow<'static, [RangeInclusive<char>]>,
    /// Dead time in milliseconds
    pub dead_time: TimeStamp,
    /// Retries limit
    pub retry_lim: usize,
}

impl Default for OTPassOptions {
    fn default() -> Self {
        Self {
            pass_size: 5,
            pass_dict: Cow::Borrowed(&ARABIC_NUMBERS_AND_LATIN_LETTERS),
            dead_time: TimeStamp::default().with_secs(5),
            retry_lim: 3,
        }
    }
}

/// One-time password auth method information
#[derive(Debug, Serialize)]
pub struct AuthInfo<I> {
    pub otpass: I,
}

/// One-time password auth user identification
#[derive(Debug, Deserialize)]
pub enum UserIdent<I> {
    #[serde(rename = "otpass")]
    OTPass {
        #[serde(flatten)]
        ident: I,
        pass: Option<String>,
    },
}

/// One-time password auth token
#[derive(Debug, Serialize, Deserialize)]
pub struct AuthToken {
    /// Generated password
    pub pass: String,
    /// Token creating time
    pub ctime: TimeStamp,
    /// Auth retries
    pub retry: usize,
}

impl AuthToken {
    pub fn new(ctime: TimeStamp, options: &OTPassOptions) -> Self {
        AuthToken {
            pass: gen_password(options.pass_size, &options.pass_dict),
            ctime,
            retry: 0,
        }
    }
}
