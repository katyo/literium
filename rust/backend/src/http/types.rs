pub use httplib::{request::Builder as HttpRequestBuilder, StatusCode};
use httplib::{Request, Response};
pub use hyper::{Body as HttpBody, Chunk as HttpChunk};

/// Http client request
pub type HttpRequest = Request<HttpBody>;

/// Http client response
pub type HttpResponse = Response<HttpBody>;
