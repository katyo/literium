use futures::{future::err, Future};
pub use http::request::Builder as HttpRequestBuilder;
use http::{Error as HttpError, Request, Response};
use hyper::{
    client::{connect::dns::Resolve, HttpConnector, ResponseFuture},
    Client, Error as HyperError,
};
pub use hyper::{Body as HttpBody, Chunk as HttpChunk};
use hyper_tls::HttpsConnector;
use native_tls::TlsConnector;
use serde_qs as qs;
use std::error::Error;
use std::fmt::{Debug, Display, Formatter, Result as FmtResult};
use BoxFuture;

pub type HttpRequest = Request<HttpBody>;
pub type HttpResponse = Response<HttpBody>;

/// HTTP client error
#[derive(Debug)]
pub enum HttpClientError<E, D> {
    Http(HttpError),
    Hyper(HyperError),
    Query(qs::Error),
    Encode(E),
    Decode(D),
    Missing,
}

impl<E, D> Error for HttpClientError<E, D>
where
    E: Debug + Display,
    D: Debug + Display,
{
}

impl<E, D> Display for HttpClientError<E, D>
where
    E: Display,
    D: Display,
{
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        use self::HttpClientError::*;
        match self {
            Http(error) => write!(f, "Http error: {}", error),
            Hyper(error) => write!(f, "Hyper error: {}", error),
            Query(error) => write!(f, "Query encoding error: {}", error),
            Encode(error) => write!(f, "Body encoding error: {}", error),
            Decode(error) => write!(f, "Body decoding error: {}", error),
            Missing => f.write_str("Missing response body"),
        }
    }
}

/// Convert something into request
pub trait IntoHttpRequest<E> {
    fn into_request(self, builder: HttpRequestBuilder) -> Result<HttpRequest, E>;
}

/// Convert response into something
pub trait FromHttpResponse<E> {
    fn from_response(resp: HttpResponse) -> BoxFuture<Self, E>;
}

pub mod request {
    use super::{
        FromHttpResponse, HttpBody, HttpChunk, HttpClientError, HttpRequest, HttpRequestBuilder,
        HttpResponse, IntoHttpRequest,
    };
    use futures::{Future, Stream};
    use http::{
        header::{HeaderName, HeaderValue},
        HttpTryFrom, Method as Method_, Uri,
    };
    use serde::{de::DeserializeOwned, Serialize};
    use serde_json as json;
    use serde_qs as qs;
    use std::fmt::{Display, Formatter, Result as FmtResult};
    use std::ops::Deref;
    use BoxFuture;

    /// Set method to request
    pub struct Method<M, B>(pub M, pub B);

    impl<E, D, M, B> IntoHttpRequest<HttpClientError<E, D>> for Method<M, B>
    where
        Method_: HttpTryFrom<M>,
        B: IntoHttpRequest<HttpClientError<E, D>>,
    {
        fn into_request(
            self,
            mut builder: HttpRequestBuilder,
        ) -> Result<HttpRequest, HttpClientError<E, D>> {
            builder.method(self.0);
            self.1.into_request(builder)
        }
    }

    /// Set url to request
    pub struct Url<U, B>(pub U, pub B);

    impl<E, D, U, B> IntoHttpRequest<HttpClientError<E, D>> for Url<U, B>
    where
        Uri: HttpTryFrom<U>,
        B: IntoHttpRequest<HttpClientError<E, D>>,
    {
        fn into_request(
            self,
            mut builder: HttpRequestBuilder,
        ) -> Result<HttpRequest, HttpClientError<E, D>> {
            builder.uri(self.0);
            self.1.into_request(builder)
        }
    }

    /// Set url with query params to request
    pub struct UrlParams<U, P, B>(pub U, pub P, pub B);

    impl<E, D, U, P, B> IntoHttpRequest<HttpClientError<E, D>> for UrlParams<U, P, B>
    where
        U: Into<String>,
        P: Serialize,
        B: IntoHttpRequest<HttpClientError<E, D>>,
    {
        fn into_request(
            self,
            mut builder: HttpRequestBuilder,
        ) -> Result<HttpRequest, HttpClientError<E, D>> {
            let query = qs::to_string(&self.1).map_err(HttpClientError::Query)?;
            let mut uri = self.0.into();

            if !query.is_empty() {
                uri += "?";
                uri += &query;
            }

            builder.uri(uri);
            self.2.into_request(builder)
        }
    }

    /// Add header to request
    pub struct Header<K, V, B>(pub K, pub V, pub B);

    impl<E, D, K, V, B> IntoHttpRequest<HttpClientError<E, D>> for Header<K, V, B>
    where
        HeaderName: HttpTryFrom<K>,
        HeaderValue: HttpTryFrom<V>,
        B: IntoHttpRequest<HttpClientError<E, D>>,
    {
        fn into_request(
            self,
            mut builder: HttpRequestBuilder,
        ) -> Result<HttpRequest, HttpClientError<E, D>> {
            builder.header(self.0, self.1);
            self.2.into_request(builder)
        }
    }

    #[derive(Debug)]
    pub struct NoError;

    impl Display for NoError {
        fn fmt(&self, _f: &mut Formatter) -> FmtResult {
            Ok(())
        }
    }

    /// No body (or empty) for responses and requests
    pub struct NoBody;

    impl<D> IntoHttpRequest<HttpClientError<NoError, D>> for NoBody {
        fn into_request(
            self,
            mut builder: HttpRequestBuilder,
        ) -> Result<HttpRequest, HttpClientError<NoError, D>> {
            builder
                .body(HttpBody::empty())
                .map_err(HttpClientError::Http)
        }
    }

    impl<E> FromHttpResponse<HttpClientError<E, NoError>> for NoBody
    where
        E: Send + 'static,
    {
        fn from_response(resp: HttpResponse) -> BoxFuture<Self, HttpClientError<E, NoError>> {
            Box::new(
                resp.into_body()
                    .concat2()
                    .map_err(HttpClientError::Hyper)
                    .map(|_| NoBody),
            )
        }
    }

    /// Raw concatenated body for responses and requests
    pub struct RawBody<T>(pub T);

    impl<T> RawBody<T> {
        /// Unwrap inner data
        pub fn into_inner(self) -> T {
            self.0
        }
    }

    impl<T> Deref for RawBody<T> {
        type Target = T;

        fn deref(&self) -> &Self::Target {
            &self.0
        }
    }

    impl<D, T> IntoHttpRequest<HttpClientError<NoError, D>> for RawBody<T>
    where
        T: Into<HttpBody>,
    {
        fn into_request(
            self,
            mut builder: HttpRequestBuilder,
        ) -> Result<HttpRequest, HttpClientError<NoError, D>> {
            builder.body(self.0.into()).map_err(HttpClientError::Http)
        }
    }

    impl<E, T> FromHttpResponse<HttpClientError<E, NoError>> for RawBody<T>
    where
        E: Send + 'static,
        T: From<HttpChunk> + Send + 'static,
    {
        fn from_response(resp: HttpResponse) -> BoxFuture<Self, HttpClientError<E, NoError>> {
            Box::new(
                resp.into_body()
                    .concat2()
                    .map_err(HttpClientError::Hyper)
                    .map(T::from)
                    .map(RawBody),
            )
        }
    }

    /// Json body for responses and requests
    pub struct JsonBody<T>(pub T);

    impl<T> JsonBody<T> {
        /// Unwrap inner data
        pub fn into_inner(self) -> T {
            self.0
        }
    }

    impl<T> Deref for JsonBody<T> {
        type Target = T;

        fn deref(&self) -> &Self::Target {
            &self.0
        }
    }

    impl<D, T> IntoHttpRequest<HttpClientError<json::Error, D>> for JsonBody<T>
    where
        T: Serialize,
    {
        fn into_request(
            self,
            mut builder: HttpRequestBuilder,
        ) -> Result<HttpRequest, HttpClientError<json::Error, D>> {
            let data = json::to_vec(&self.0).map_err(HttpClientError::Encode)?;
            builder.body(data.into()).map_err(HttpClientError::Http)
        }
    }

    impl<E, T> FromHttpResponse<HttpClientError<E, json::Error>> for JsonBody<T>
    where
        E: Send + 'static,
        T: DeserializeOwned + Send + 'static,
    {
        fn from_response(resp: HttpResponse) -> BoxFuture<Self, HttpClientError<E, json::Error>> {
            Box::new(
                resp.into_body()
                    .concat2()
                    .map_err(HttpClientError::Hyper)
                    .and_then(|data| {
                        json::from_slice(&data.into_bytes()).map_err(HttpClientError::Decode)
                    }).map(JsonBody),
            )
        }
    }

    /// Url-encoded body for responses and requests
    pub struct UrlEncodedBody<T>(pub T);

    impl<T> UrlEncodedBody<T> {
        /// Unwrap inner data
        pub fn into_inner(self) -> T {
            self.0
        }
    }

    impl<T> Deref for UrlEncodedBody<T> {
        type Target = T;

        fn deref(&self) -> &Self::Target {
            &self.0
        }
    }

    impl<D, T> IntoHttpRequest<HttpClientError<qs::Error, D>> for UrlEncodedBody<T>
    where
        T: Serialize,
    {
        fn into_request(
            self,
            mut builder: HttpRequestBuilder,
        ) -> Result<HttpRequest, HttpClientError<qs::Error, D>> {
            let data = qs::to_string(&self.0).map_err(HttpClientError::Encode)?;
            builder.body(data.into()).map_err(HttpClientError::Http)
        }
    }

    impl<E, T> FromHttpResponse<HttpClientError<E, qs::Error>> for UrlEncodedBody<T>
    where
        E: Send + 'static,
        T: DeserializeOwned + Send + 'static,
    {
        fn from_response(resp: HttpResponse) -> BoxFuture<Self, HttpClientError<E, qs::Error>> {
            Box::new(
                resp.into_body()
                    .concat2()
                    .map_err(HttpClientError::Hyper)
                    .and_then(|data| {
                        qs::from_bytes(&data.into_bytes()).map_err(HttpClientError::Decode)
                    }).map(UrlEncodedBody),
            )
        }
    }
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

    /*
    fn get_json<U: Into<String>, P: Serialize, O: DeserializeOwned>(
        &self,
        url: U,
        params: P,
    ) -> BoxFuture<O, HttpClientError>
    where
        O: Send + 'static,
    {
        use self::HttpClientError::*;

        let request = match qs::to_string(&params)
            .map_err(QueryFormat)
            .and_then(|query| {
                let mut url: String = url.into();

                if !query.is_empty() {
                    url += "?";
                    url += &query;
                }

                HttpRequest::get(url)
                    .header("Accept", "application/json")
                    .body(HttpBody::empty())
                    .map_err(Http)
            }) {
            Ok(request) => request,
            Err(error) => return Box::new(err(error)),
        };

        Box::new(
            self.send_request(request)
                .map_err(Hyper)
                .and_then(|response| {
                    if response.status().is_success() {
                        Either::A(response.into_body().concat2().map_err(Hyper))
                    } else {
                        Either::B(err(MissingData))
                    }
                }).and_then(|body| json::from_slice(&body.into_bytes()).map_err(JsonParse)),
        )
    }
     */
    /*
    fn post_json<U: Into<String>, P: Serialize, O: DeserializeOwned>(
        &self,
        url: &U,
        params: P,
    ) -> BoxFuture<O, HttpClientError>
    where
        O: Send + 'static,
    {
        use self::HttpClientError::*;

        let request = match qs::to_string(&params)
            .map_err(QueryFormat)
            .and_then(|query| {
                let mut url: String = url.into();

                if !query.is_empty() {
                    url += "?";
                    url += &query;
                }

                HttpRequest::get(url)
                    .header("Accept", "application/json")
                    .body(HttpBody::empty())
                    .map_err(Http)
            }) {
            Ok(request) => request,
            Err(error) => return Box::new(err(error)),
        };

        Box::new(
            self.send_request(request)
                .map_err(Hyper)
                .and_then(|response| {
                    if response.status().is_success() {
                        Either::A(response.into_body().concat2().map_err(Hyper))
                    } else {
                        Either::B(err(MissingData))
                    }
                }).and_then(|body| json::from_slice(&body.into_bytes()).map_err(JsonParse)),
        )
    }*/
}

/// State has HTTP client
pub trait HasHttpClient
where
    Self: AsRef<<Self as HasHttpClient>::HttpClient>,
{
    type HttpClient: IsHttpClient;
}

type HyperHttpClient<R> = Client<HttpsConnector<HttpConnector<R>>, HttpBody>;

/// HTTP client with TLS support
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
