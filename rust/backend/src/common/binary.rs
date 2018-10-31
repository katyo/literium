use sodiumoxide::crypto::box_::{PublicKey, SecretKey};

/// Get raw binary data from specific type
pub trait AsBinary {
    fn as_binary(&self) -> &[u8];
}

/// Convert raw binary data into specific type
pub trait FromBinary
where
    Self: Sized,
{
    fn from_binary(b: &[u8]) -> Option<Self>;
}

impl AsBinary for Vec<u8> {
    fn as_binary(&self) -> &[u8] {
        &self
    }
}

impl FromBinary for Vec<u8> {
    fn from_binary(b: &[u8]) -> Option<Self> {
        Some(b.into())
    }
}

impl AsBinary for PublicKey {
    fn as_binary(&self) -> &[u8] {
        self.as_ref()
    }
}

impl FromBinary for PublicKey {
    fn from_binary(b: &[u8]) -> Option<Self> {
        PublicKey::from_slice(b)
    }
}

impl AsBinary for SecretKey {
    fn as_binary(&self) -> &[u8] {
        &self[..]
    }
}

impl FromBinary for SecretKey {
    fn from_binary(b: &[u8]) -> Option<Self> {
        SecretKey::from_slice(b)
    }
}
