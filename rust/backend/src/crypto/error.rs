use http::StatusCode;
use std::error::Error;
use std::fmt::{Display, Formatter, Result as FmtResult};
use warp::{reply, Rejection, Reply};

/// Cryptography error
#[derive(Copy, Clone, Debug)]
pub enum CryptoError {
    BadMime,
    BadBase64,
    BadCrypto,
    BadUtf8,
    BadJson,
    FailJson,
}

impl Display for CryptoError {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::CryptoError::*;
        match self {
            BadMime => f.write_str("Unsupported content-type"),
            BadBase64 => f.write_str("Invalid base64 data"),
            BadCrypto => f.write_str("Unable to decrypt"),
            BadUtf8 => f.write_str("Invalid UTF8 string"),
            BadJson => f.write_str("Invalid JSON data"),
            FailJson => f.write_str("Unable to encode JSON data"),
        }
    }
}

impl Error for CryptoError {}

impl CryptoError {
    /// Convert encryption/decryption errors into reply
    pub fn crypto_recover(error: Rejection) -> Result<impl Reply, Rejection> {
        if let Some(&error) = error.find_cause::<CryptoError>() {
            use self::CryptoError::*;
            let code = match error {
                BadMime | BadBase64 | BadCrypto | BadUtf8 | BadJson => StatusCode::BAD_REQUEST,
                FailJson => StatusCode::INTERNAL_SERVER_ERROR,
            };

            Ok(reply::with_status(error.to_string(), code))
        } else {
            Err(error)
        }
    }
}
