/*!

## DNS support

This module contains asynchronous domain name resolver.

The resolver can be used with HTTP(S) client and with Email sender.

*/

#[cfg(feature = "name_resolver")]
mod resolver;

#[cfg(feature = "name_resolver")]
pub use self::resolver::*;
