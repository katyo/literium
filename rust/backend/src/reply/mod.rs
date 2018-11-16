/*!

## Literium-specific replies

The replies which widely used by literium web-framework.

### Supported replies

* Reply with BASE64 encoded sealed JSON body
* Reply with Server-Sent Events (SSE) stream

 */

mod json_stream;
mod sealed_json;
mod sse;
mod types;

pub use self::json_stream::*;
pub use self::sealed_json::*;
pub use self::sse::*;
pub use self::types::*;
