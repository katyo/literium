/*!

## Literium-specific replies

The replies which widely used by literium web-framework.

### Supported replies

* Reply with BASE64 encoded sealed JSON body
* Reply with Server-Sent Events (SSE) stream

 */

mod sealed_json;
mod sse;

pub use self::sealed_json::*;
pub use self::sse::*;

/// Shortcut for [`reply::base64_sealed_json`]
pub use self::base64_sealed_json as x_json;
