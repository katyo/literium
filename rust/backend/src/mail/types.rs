pub use emailmessage::{
    header, Mailbox, Mailboxes, Message as MailMessage, MultiPart, Part, SinglePart,
};

use TimeStamp;

use std::error::Error;
use std::fmt;
use std::net::IpAddr;

#[derive(Debug)]
pub enum MailerError {
    BadConfig(String),
    BadMessage,
    ServerError,
}

impl Error for MailerError {}

impl fmt::Display for MailerError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        use self::MailerError::*;
        match self {
            BadConfig(error) => write!(f, "Invalid mailer config: {}", error),
            ServerError => f.write_str("Email server error"),
            BadMessage => f.write_str("Bad email message"),
        }
    }
}

/// SMTP client security
#[derive(Debug, PartialEq, Clone, Copy, Serialize, Deserialize)]
pub enum SmtpSecurity {
    /// Use STARTTLS
    #[serde(rename = "starttls")]
    StartTls,
    /// Use SSL (Direct TLS)
    #[serde(rename = "ssl")]
    Ssl,
}

impl Default for SmtpSecurity {
    fn default() -> Self {
        SmtpSecurity::StartTls
    }
}

/// SMTP client authentication
#[derive(Debug, PartialEq, Clone, Copy, Serialize, Deserialize)]
pub enum SmtpAuth {
    #[serde(rename = "plain")]
    Plain,
    #[serde(rename = "login")]
    Login,
}

impl Default for SmtpAuth {
    fn default() -> Self {
        SmtpAuth::Plain
    }
}

/// SMTP client configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmtpConfig {
    /// SMTP server hostname
    pub host: String,

    /// SMTP server IP-address
    ///
    /// Provide IP-address to skip domain name resolving.
    #[serde(default)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub addr: Option<IpAddr>,

    /// SMTP server port
    ///
    /// When missing will be set to default SMTP MSA port (587).
    #[serde(default)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<u16>,

    /// SMTP authentication method
    #[serde(default)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auth: Option<SmtpAuth>,

    /// SMTP user name
    #[serde(default)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user: Option<String>,

    /// SMTP password
    #[serde(default)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pass: Option<String>,

    /// SMTP security
    ///
    /// By default insecure connection will be used.
    #[serde(default)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tls: Option<SmtpSecurity>,

    /// Server keep-alive timeout
    ///
    /// To prevent reconnecting on each mail sending you can set timeout in microseconds greater than zero.
    #[serde(default)]
    #[serde(skip_serializing_if = "TimeStamp::is_zero")]
    pub keep: TimeStamp,

    /// SMTP address to use in *From* header
    ///
    /// Most SMTP servers prevents using addresses which is not associated with authenticated user.
    pub from: Option<Mailbox>,
}

impl Default for SmtpConfig {
    fn default() -> Self {
        SmtpConfig {
            host: "to-be.set".into(),
            addr: None,
            port: None,
            auth: None,
            user: None,
            pass: None,
            tls: None,
            keep: TimeStamp::default(),
            from: None, //"Need to be set <need@to-be.set>".parse().unwrap(),
        }
    }
}
