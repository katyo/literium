/*!

## Authentication methods

### Native authentication

This is a simplest method which uses only username and password.

1. Server data: nothing
2. User identification data:
  * User name (`name: string`)
  * Password (`pass: string`)

### OAuth2 authentication

This method uses user accounts on third party services which implements OAuth2 technology.

1. Server data: (`name: data{}`)
  * Service name
  * Service data
2. User identification data:
   * OAuth2 token

See [examples/auth.rs]

 */

mod traits;

#[cfg(feature = "native_auth")]
pub mod native;
#[cfg(feature = "oauth2_auth")]
pub mod oauth2;
#[cfg(feature = "otpass_auth")]
pub mod otpass;

pub use self::traits::*;
