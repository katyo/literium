/*!

### OAuth2 auth

This method provides OAuth2 authorization using account on third Web-services like **Github**, **Google**, **Facebook**, and etc.

*/

mod method;
mod traits;
mod types;

pub use self::method::*;
pub use self::traits::*;
pub use self::types::*;
