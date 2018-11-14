/*!

## HTTP(S) support

This module contains asynchronous HTTP(S) client and HTTP request construction kit.

The request constructor is an easy way to exchange data with remote servers using HTTP.

 */

#[cfg(feature = "http_client")]
pub mod client;
pub mod request;
mod types;

pub use self::types::*;
