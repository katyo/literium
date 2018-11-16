/*!

## Literium-specific filters

The filters which widely used by literium web-framework.

### Supported filters

* Extracting BASE64 encoded sealed JSON body
* Using BASE64 encoded sealed JSON authorization

*/

#[cfg(feature = "auth")]
mod sealed_auth;
mod sealed_json;

#[cfg(feature = "auth")]
pub use self::sealed_auth::base64_sealed_auth;
pub use self::sealed_json::base64_sealed_json;

/// Shortcut for [`base64_sealed_auth`]
#[cfg(feature = "auth")]
pub use self::base64_sealed_auth as x_auth;

/// Shortcut for [`base64_sealed_json`]
pub use self::base64_sealed_json as x_json;
