use std::ops::Deref;
use std::rc::Rc;
use std::sync::Arc;

use super::{PublicKey, SecretKey};

/// The type which can provide public key
pub trait HasPublicKey {
    /// Get reference to public key
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
    /// Get reference to secret key
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
