/*!

### One-time password auth

This method provides one-time password auth using *email*, *mobile phone* and etc.

*/

mod method;
mod traits;
mod types;

#[cfg(feature = "send_mail")]
mod email;
#[cfg(feature = "send_sms")]
mod phone;

pub use self::method::*;
pub use self::traits::*;
pub use self::types::*;

#[cfg(feature = "send_mail")]
pub use self::email::*;
#[cfg(feature = "send_sms")]
pub use self::phone::*;
