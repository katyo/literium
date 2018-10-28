use sodiumoxide::crypto::box_::{PublicKey, SecretKey};
use sodiumoxide::crypto::secretbox::Key;

/// Convert raw binary data into specific type
pub trait FromBinary
where
    Self: Sized,
{
    fn from_binary(b: &[u8]) -> Option<Self>;
}

impl FromBinary for Vec<u8> {
    fn from_binary(b: &[u8]) -> Option<Self> {
        Some(b.into())
    }
}

impl FromBinary for PublicKey {
    fn from_binary(b: &[u8]) -> Option<Self> {
        PublicKey::from_slice(b)
    }
}

impl FromBinary for SecretKey {
    fn from_binary(b: &[u8]) -> Option<Self> {
        SecretKey::from_slice(b)
    }
}

impl FromBinary for Key {
    fn from_binary(b: &[u8]) -> Option<Self> {
        Key::from_slice(b.as_ref())
    }
}
