/*!

## Literium-specific cryptography basics

This module implements asymmetric cryptography as additional layer of security for client-server data exchange.

It uses *sealed-box* encryption from **[NaCL](https://nacl.cr.yp.to/)** (**[libsodium](https://libsodium.gitbook.io/)**).

*/

mod crypto;
mod error;
mod traits;
mod types;

pub use self::crypto::{decrypt_base64_sealed_json, encrypt_base64_sealed_json};
pub use self::error::CryptoError;
pub use self::traits::{HasPublicKey, HasSecretKey};
pub use self::types::{initialize, random_bytes, CryptoKeys, PublicKey, SecretKey};

/// Shortcut for [`decrypt_base64_sealed_json`]
pub use self::decrypt_base64_sealed_json as open_x_json;

/// Shortcut for [`encrypt_base64_sealed_json`]
pub use self::encrypt_base64_sealed_json as seal_x_json;
