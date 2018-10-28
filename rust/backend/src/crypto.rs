use base64lib as b64;
use http::StatusCode;
use serde::{de::DeserializeOwned, Serialize};
use serde_json;
use sodiumoxide::crypto::sealedbox;
use std::error::Error;
use std::fmt::{Display, Formatter, Result as FmtResult};
use std::ops::Deref;
use std::rc::Rc;
use std::sync::Arc;
use warp::{reject::custom, reply, Rejection, Reply};

pub use sodiumoxide::{
    crypto::{
        box_::{gen_keypair as gen_keys, PublicKey, SecretKey},
        secretbox::Key,
    },
    randombytes::randombytes as random_bytes,
};

/// The type which can provide public key
pub trait HasPublicKey {
    fn get_public_key(&self) -> &PublicKey;
}

impl<'a, T: HasPublicKey> HasPublicKey for &'a T {
    fn get_public_key(&self) -> &PublicKey {
        (*self).get_public_key()
    }
}

impl<T: HasPublicKey> HasPublicKey for Arc<T> {
    fn get_public_key(&self) -> &PublicKey {
        self.deref().get_public_key()
    }
}

impl<T: HasPublicKey> HasPublicKey for Rc<T> {
    fn get_public_key(&self) -> &PublicKey {
        self.deref().get_public_key()
    }
}

impl HasPublicKey for (PublicKey, SecretKey) {
    fn get_public_key(&self) -> &PublicKey {
        &self.0
    }
}

impl HasPublicKey for (SecretKey, PublicKey) {
    fn get_public_key(&self) -> &PublicKey {
        &self.1
    }
}

/// The type which can provide secret key
pub trait HasSecretKey {
    fn get_secret_key(&self) -> &SecretKey;
}

impl<'a, T: HasSecretKey> HasSecretKey for &'a T {
    fn get_secret_key(&self) -> &SecretKey {
        (*self).get_secret_key()
    }
}

impl<T: HasSecretKey> HasSecretKey for Arc<T> {
    fn get_secret_key(&self) -> &SecretKey {
        self.deref().get_secret_key()
    }
}

impl<T: HasSecretKey> HasSecretKey for Rc<T> {
    fn get_secret_key(&self) -> &SecretKey {
        self.deref().get_secret_key()
    }
}

impl HasSecretKey for (SecretKey, PublicKey) {
    fn get_secret_key(&self) -> &SecretKey {
        &self.0
    }
}

impl HasSecretKey for (PublicKey, SecretKey) {
    fn get_secret_key(&self) -> &SecretKey {
        &self.1
    }
}

#[derive(Copy, Clone, Debug)]
pub enum DecryptError {
    Mime,
    Base64,
    Crypto,
    Json,
}

impl Display for DecryptError {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::DecryptError::*;
        match self {
            Mime => f.write_str("Unsupported content-type"),
            Base64 => f.write_str("Invalid base64 data"),
            Crypto => f.write_str("Unable to decrypt"),
            Json => f.write_str("Invalid JSON data"),
        }
    }
}

impl Error for DecryptError {}

/// Decrypt base64 encoded sealed JSON deserializable data
pub fn decrypt_base64_sealed_json<T, B, K>(source: B, keys: K) -> Result<T, Rejection>
where
    T: DeserializeOwned,
    B: AsRef<[u8]>,
    K: HasPublicKey + HasSecretKey,
{
    let enc = b64::decode(source.as_ref()).map_err(|_| custom(DecryptError::Base64))?;

    let json = sealedbox::open(&enc, keys.get_public_key(), keys.get_secret_key())
        .map_err(|_| custom(DecryptError::Crypto))?;

    serde_json::from_slice(&json).map_err(|_| custom(DecryptError::Json))
}

#[derive(Copy, Clone, Debug)]
pub enum EncryptError {
    Json,
}

impl Display for EncryptError {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::EncryptError::*;
        match self {
            Json => f.write_str("Unable to encode JSON data"),
        }
    }
}

impl Error for EncryptError {}

/// Encrypt serializable data as base64 encoded sealed JSON
pub fn encrypt_base64_sealed_json<T, K>(data: &T, key: K) -> Result<String, Rejection>
where
    T: Serialize,
    K: HasPublicKey,
{
    let json = serde_json::to_vec(&data).map_err(|_| custom(EncryptError::Json))?;

    let enc = sealedbox::seal(&json, key.get_public_key());

    Ok(b64::encode(&enc))
}

pub fn crypto_recover(error: Rejection) -> Result<impl Reply, Rejection> {
    if let Some(&error) = error.find_cause::<DecryptError>() {
        Ok(reply::with_status(
            error.to_string(),
            StatusCode::BAD_REQUEST,
        ))
    } else if let Some(&error) = error.find_cause::<EncryptError>() {
        Ok(reply::with_status(
            error.to_string(),
            StatusCode::INTERNAL_SERVER_ERROR,
        ))
    } else {
        Err(error)
    }
}
