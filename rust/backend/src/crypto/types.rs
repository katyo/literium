use base64lib::{decode, encode};
use bytes::Bytes;
use serde::{de, ser, Deserialize, Serialize};
use std::error::Error;
use std::fmt;
use std::str::FromStr;

use super::{CanDecrypt, CanEncrypt, CanKeygen, CryptoError, HasPublicKey, HasSecretKey};

pub use sodiumoxide::{
    crypto::box_::{PublicKey, SecretKey},
    crypto::secretbox::Key as SecureKey,
    init as initialize,
    randombytes::randombytes as random_bytes,
};

/// Key pair for encryption and decryption
#[derive(Debug, Clone)]
pub struct CryptoKeys {
    public_key: PublicKey,
    secret_key: SecretKey,
}

/// Crypto key error
#[derive(Debug)]
pub enum CryptoKeyError {
    /// Invalid base64 then parsing secret key from string
    BadBase64,

    /// Invalid length of binary data then parsing key
    BadKey,
}

impl fmt::Display for CryptoKeyError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        use self::CryptoKeyError::*;
        match self {
            BadBase64 => f.write_str("Bad base64 data"),
            BadKey => f.write_str("Bad key data"),
        }
    }
}

impl Error for CryptoKeyError {}

impl FromStr for CryptoKeys {
    type Err = CryptoKeyError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let b: Vec<u8> = decode(s).map_err(|_| CryptoKeyError::BadBase64)?;
        let secret_key = SecretKey::from_slice(&b).ok_or_else(|| CryptoKeyError::BadKey)?;
        let public_key = secret_key.public_key();
        Ok(Self {
            public_key,
            secret_key,
        })
    }
}

impl Serialize for CryptoKeys {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: ser::Serializer,
    {
        serializer.serialize_str(&encode(&self.secret_key[..]))
    }
}

struct CryptoKeysVisitor;

impl<'de> de::Visitor<'de> for CryptoKeysVisitor {
    type Value = CryptoKeys;

    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("Base64-encoded secret key")
    }

    fn visit_str<E>(self, src: &str) -> Result<Self::Value, E>
    where
        E: de::Error,
    {
        src.parse().map_err(de::Error::custom)
    }
}

impl<'de> Deserialize<'de> for CryptoKeys {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: de::Deserializer<'de>,
    {
        deserializer.deserialize_str(CryptoKeysVisitor)
    }
}

impl Default for CryptoKeys {
    fn default() -> Self {
        Self::gen_key()
    }
}

impl CanKeygen for CryptoKeys {
    fn gen_key() -> Self {
        let (public_key, secret_key) = <(PublicKey, SecretKey)>::gen_key();
        Self {
            public_key,
            secret_key,
        }
    }
}

impl CanEncrypt for CryptoKeys {
    fn seal_raw<B>(&self, msg: B) -> Bytes
    where
        B: AsRef<[u8]>,
    {
        self.public_key.seal_raw(msg)
    }
}

impl CanDecrypt for CryptoKeys {
    fn open_raw<B>(&self, msg: B) -> Result<Bytes, CryptoError>
    where
        B: AsRef<[u8]>,
    {
        (&self.public_key, &self.secret_key).open_raw(msg)
    }
}

impl AsRef<CryptoKeys> for CryptoKeys {
    fn as_ref(&self) -> &CryptoKeys {
        self
    }
}

impl AsRef<PublicKey> for CryptoKeys {
    fn as_ref(&self) -> &PublicKey {
        &self.public_key
    }
}

impl AsRef<SecretKey> for CryptoKeys {
    fn as_ref(&self) -> &SecretKey {
        &self.secret_key
    }
}

impl HasPublicKey for CryptoKeys {
    type PublicKey = CryptoKeys;
}

impl HasSecretKey for CryptoKeys {
    type SecretKey = CryptoKeys;
}
