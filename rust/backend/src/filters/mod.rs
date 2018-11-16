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
pub use self::sealed_auth::*;
pub use self::sealed_json::*;
