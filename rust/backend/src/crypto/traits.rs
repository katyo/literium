use super::{PublicKey, SecretKey};

/// The type which can provide public key
pub trait HasPublicKey
where
    Self: AsRef<<Self as HasPublicKey>::KeyData>,
{
    /// The type which contains public key
    type KeyData: AsRef<PublicKey>;
}

impl<'a, T: HasPublicKey> HasPublicKey for &'a T {
    type KeyData = T::KeyData;
}

/// The type which can provide secret key
pub trait HasSecretKey
where
    Self: AsRef<<Self as HasSecretKey>::KeyData>,
{
    /// The type which contains secret key
    type KeyData: AsRef<PublicKey> + AsRef<SecretKey>;
}

impl<'a, T: HasSecretKey> HasSecretKey for &'a T {
    type KeyData = T::KeyData;
}
