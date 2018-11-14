use super::{
    super::{HttpRequest, HttpRequestBuilder, HttpResponse},
    HttpClientError,
};
use base::BoxFuture;
use futures::{future::err, Future};
use hyper::Error as HyperError;

/// Convert something into request
pub trait IntoHttpRequest<E> {
    fn into_request(self, builder: HttpRequestBuilder) -> Result<HttpRequest, E>;
}

/// Convert response into something
pub trait FromHttpResponse<E> {
    fn from_response(resp: HttpResponse) -> BoxFuture<Self, E>;
}

/// HTTP client interface
pub trait IsHttpClient {
    type ResponseFuture: Future<Item = HttpResponse, Error = HyperError> + Send + 'static;

    fn send_request(&self, request: HttpRequest) -> Self::ResponseFuture;

    fn fetch<E, D, I, O>(&self, request: I) -> BoxFuture<O, HttpClientError<E, D>>
    where
        E: Send + 'static,
        D: Send + 'static,
        I: IntoHttpRequest<HttpClientError<E, D>>,
        O: FromHttpResponse<HttpClientError<E, D>> + Send + 'static,
    {
        let request = match request.into_request(HttpRequestBuilder::new()) {
            Ok(request) => request,
            Err(error) => return Box::new(err(error)),
        };

        Box::new(
            self.send_request(request)
                .map_err(HttpClientError::Hyper)
                .and_then(O::from_response),
        )
    }
}

/// State has HTTP client
pub trait HasHttpClient
where
    Self: AsRef<<Self as HasHttpClient>::HttpClient>,
{
    type HttpClient: IsHttpClient;
}
