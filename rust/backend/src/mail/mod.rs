/*!

## Email messaging functions

This feature (`send_mail`) is optional and can be disabled.

*/

mod mailer;
mod traits;
mod types;

pub use self::mailer::*;
pub use self::traits::*;
pub use self::types::*;
