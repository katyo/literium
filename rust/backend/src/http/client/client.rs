use super::{
    super::{HttpBody, HttpRequest},
    IsHttpClient,
};
use hyper::{
    client::{connect::dns::Resolve, HttpConnector, ResponseFuture},
    Client,
};
use hyper_tls::HttpsConnector;
use native_tls::TlsConnector;

type HyperHttpClient<R> = Client<HttpsConnector<HttpConnector<R>>, HttpBody>;

/// HTTP client with TLS support
///
/// This client implementation uses Hyper
#[derive(Clone)]
pub struct HttpClient<R>(HyperHttpClient<R>);

impl<R> HttpClient<R> {
    pub fn new(resolver: R) -> Self
    where
        R: Resolve + Send + Sync + Clone + 'static,
        R::Future: Send,
    {
        let http = HttpConnector::new_with_resolver(resolver);
        let tls = TlsConnector::new().unwrap();
        let https = HttpsConnector::from((http, tls));
        let client = Client::builder().build(https);

        HttpClient(client)
    }
}

impl<R> IsHttpClient for HttpClient<R>
where
    R: Resolve + Send + Sync + Clone + 'static,
    R::Future: Send,
{
    type ResponseFuture = ResponseFuture;

    fn send_request(&self, request: HttpRequest) -> Self::ResponseFuture {
        self.0.request(request)
    }
}
