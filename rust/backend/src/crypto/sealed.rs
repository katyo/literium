//use base64lib::{decode, encode};
//use serde::{de::DeserializeOwned, Serialize};
//use serde_json::{from_slice, to_vec};

use super::{CanDecrypt, CanEncrypt, CanKeygen, CryptoError, PublicKey, SecretKey};
use bytes::Bytes;
use sodiumoxide::crypto::{
    box_::gen_keypair,
    sealedbox::{open, seal},
};
//use warp::{reject::custom, Rejection};

impl CanEncrypt for PublicKey {
    fn seal_raw<B>(&self, msg: B) -> Bytes
    where
        B: AsRef<[u8]>,
    {
        seal(msg.as_ref(), &self).into()
    }
}

impl CanKeygen for (PublicKey, SecretKey) {
    fn gen_key() -> (PublicKey, SecretKey) {
        gen_keypair()
    }
}

impl CanDecrypt for (PublicKey, SecretKey) {
    fn open_raw<B>(&self, msg: B) -> Result<Bytes, CryptoError>
    where
        B: AsRef<[u8]>,
    {
        open(msg.as_ref(), &self.0, &self.1)
            .map(Bytes::from)
            .map_err(|_| CryptoError::BadCrypto)
    }
}

impl<'a> CanDecrypt for (&'a PublicKey, &'a SecretKey) {
    fn open_raw<B>(&self, msg: B) -> Result<Bytes, CryptoError>
    where
        B: AsRef<[u8]>,
    {
        open(msg.as_ref(), self.0, self.1)
            .map(Bytes::from)
            .map_err(|_| CryptoError::BadCrypto)
    }
}

/*
/// Decrypt base64 encoded sealed JSON deserializable data
pub fn decrypt_base64_sealed_json<T, B, K>(source: B, keys: K) -> Result<T, Rejection>
where
    T: DeserializeOwned,
    B: AsRef<[u8]>,
    K: AsRef<PublicKey> + AsRef<SecretKey>,
{
    let enc = decode(source.as_ref()).map_err(|_| custom(CryptoError::BadBase64))?;

    let json =
        open(&enc, keys.as_ref(), keys.as_ref()).map_err(|_| custom(CryptoError::BadCrypto))?;

    from_slice(&json).map_err(|_| custom(CryptoError::BadJson))
}

/// Encrypt serializable data as base64 encoded sealed JSON
pub fn encrypt_base64_sealed_json<T, K>(data: T, key: K) -> Result<String, Rejection>
where
    T: Serialize,
    K: AsRef<PublicKey>,
{
    let json = to_vec(&data).map_err(|_| custom(CryptoError::FailJson))?;

    let enc = seal(&json, key.as_ref());

    Ok(encode(&enc))
}
 */
