use super::CryptoError;
use base64lib::{decode, encode};
use bytes::Bytes;
use serde::{de::DeserializeOwned, Serialize};
use serde_json::{from_slice, to_vec};
use std::str::from_utf8;

/// Something with key generation capabilities
pub trait CanKeygen {
    /// Generate new key
    fn gen_key() -> Self;
}

/// Something with encryption capabilities
pub trait CanEncrypt {
    /// Encrypt message using this key
    fn seal_raw<B>(&self, msg: B) -> Bytes
    where
        B: AsRef<[u8]>;

    /// Encrypt text data
    fn seal_text_raw<S>(&self, data: S) -> Bytes
    where
        S: AsRef<str>,
    {
        self.seal_raw(data.as_ref().as_bytes())
    }

    /// Serialize to JSON and encrypt data
    fn seal_json_raw<T>(&self, data: T) -> Result<Bytes, CryptoError>
    where
        T: Serialize,
    {
        to_vec(&data)
            .map_err(|error| {
                error!("Unable to serialize JSON: {}", error);
                CryptoError::FailJson
            }).map(|json| self.seal_raw(&json))
    }

    /// Serialize to JSON, encrypt data and encode to base64 string
    fn seal_json_b64<T>(&self, data: T) -> Result<String, CryptoError>
    where
        T: Serialize,
    {
        self.seal_json_raw(data).map(|raw| encode(&raw))
    }
}

/// Something with decryption capabilities
pub trait CanDecrypt {
    /// Decrypt message using this key
    fn open_raw<B>(&self, msg: B) -> Result<Bytes, CryptoError>
    where
        B: AsRef<[u8]>;

    /// Decrypt text data
    fn open_text_raw<B, S>(&self, msg: B) -> Result<S, CryptoError>
    where
        B: AsRef<[u8]>,
        for<'a> S: From<&'a str>,
    {
        self.open_raw(msg).and_then(|raw| {
            from_utf8(&raw)
                .map_err(|error| {
                    error!("Unable to decode UTF8: {}", error);
                    CryptoError::BadUtf8
                }).map(S::from)
        })
    }

    /// Decrypt and deserialize JSON data
    fn open_json_raw<B, T>(&self, msg: B) -> Result<T, CryptoError>
    where
        B: AsRef<[u8]>,
        T: DeserializeOwned,
    {
        self.open_raw(msg).and_then(|json| {
            from_slice(&json).map_err(|error| {
                error!("Unable to deserialize JSON: {}", error);
                CryptoError::BadJson
            })
        })
    }

    /// Decode base64 string, decrypt and deserialize JSON data
    fn open_json_b64<S, T>(&self, msg: S) -> Result<T, CryptoError>
    where
        S: AsRef<[u8]>,
        T: DeserializeOwned,
    {
        decode(msg.as_ref())
            .map_err(|_| CryptoError::BadBase64)
            .and_then(|raw| self.open_json_raw(&raw))
    }
}

/// The type which can provide public key
pub trait HasPublicKey
where
    Self: AsRef<<Self as HasPublicKey>::PublicKey>,
{
    /// The type which contains public key
    type PublicKey: CanEncrypt;
}

impl<'a, T: HasPublicKey> HasPublicKey for &'a T {
    type PublicKey = T::PublicKey;
}

/// The type which can provide secret key
pub trait HasSecretKey
where
    Self: AsRef<<Self as HasSecretKey>::SecretKey>,
{
    /// The type which contains secret key
    type SecretKey: CanKeygen + CanDecrypt;
}

impl<'a, T: HasSecretKey> HasSecretKey for &'a T {
    type SecretKey = T::SecretKey;
}

/// The type which can provide secure key
pub trait HasSecureKey
where
    Self: AsRef<<Self as HasSecureKey>::SecureKey>,
{
    /// The type which contains secure key
    type SecureKey: CanKeygen + CanEncrypt + CanDecrypt;
}

impl<'a, T: HasSecureKey> HasSecureKey for &'a T {
    type SecureKey = T::SecureKey;
}
