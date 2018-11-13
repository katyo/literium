/*!

## Literium-specific cryptography basics

This module implements asymmetric cryptography as additional layer of security for client-server data exchange.

It uses *sealed-box* encryption from **[NaCL](https://nacl.cr.yp.to/)** (**[libsodium](https://libsodium.gitbook.io/)**).

*/

mod error;
mod sealed;
mod secure;
mod traits;
mod types;

pub use self::error::CryptoError;
pub use self::traits::*;
pub use self::types::{initialize, random_bytes, CryptoKeys, PublicKey, SecretKey, SecureKey};
