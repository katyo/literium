use super::{
    super::{
        request::{
            Header, JsonBody, Method, NoBody, NoError, RawBody, Url, UrlEncodedBody, UrlWithQuery,
        },
        HttpBody, HttpChunk, HttpRequest, HttpRequestBuilder, HttpResponse,
    },
    FromHttpResponse, HttpClientError, IntoHttpRequest,
};
use base::BoxFuture;
use futures::{Future, Stream};
use httplib::{
    header::{HeaderName, HeaderValue},
    HttpTryFrom, Method as Method_, Uri,
};
use serde::{de::DeserializeOwned, Serialize};
use serde_json as json;
use serde_qs as qs;

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

impl<E, D, U, P, B> IntoHttpRequest<HttpClientError<E, D>> for UrlWithQuery<U, P, B>
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
