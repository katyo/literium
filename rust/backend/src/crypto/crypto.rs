use base64lib::{decode, encode};
use serde::{de::DeserializeOwned, Serialize};
use serde_json::{from_slice, to_vec};
use sodiumoxide::crypto::sealedbox::{open, seal};
use warp::{reject::custom, Rejection};

use super::{CryptoError, HasPublicKey, HasSecretKey};

/// Decrypt base64 encoded sealed JSON deserializable data
pub fn decrypt_base64_sealed_json<T, B, K>(source: B, keys: K) -> Result<T, Rejection>
where
    T: DeserializeOwned,
    B: AsRef<[u8]>,
    K: HasPublicKey + HasSecretKey,
{
    let enc = decode(source.as_ref()).map_err(|_| custom(CryptoError::BadBase64))?;

    let json = open(&enc, keys.get_public_key(), keys.get_secret_key())
        .map_err(|_| custom(CryptoError::BadCrypto))?;

    from_slice(&json).map_err(|_| custom(CryptoError::BadJson))
}

/// Encrypt serializable data as base64 encoded sealed JSON
pub fn encrypt_base64_sealed_json<T, K>(data: &T, key: K) -> Result<String, Rejection>
where
    T: Serialize,
    K: HasPublicKey,
{
    let json = to_vec(&data).map_err(|_| custom(CryptoError::FailJson))?;

    let enc = seal(&json, key.get_public_key());

    Ok(encode(&enc))
}
