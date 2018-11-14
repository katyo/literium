use crypto::{CanEncrypt, HasPublicKey};
use http::StatusCode;
use httplib::Response;
use serde::Serialize;
use warp::{reject::custom, Reply};

const MIME_TYPE: &str = "application/x-base64-sealed-json";

/// Reply with base64 encoded sealed JSON body
///
/// `Content-Type` header will be set to "application/x-base64-sealed-json"
pub fn base64_sealed_json<T, S>(data: T, state: S) -> impl Reply
where
    T: Serialize,
    S: HasPublicKey,
{
    (state.as_ref() as &S::PublicKey)
        .seal_json_b64(data)
        .map_err(custom)
        .map(|data| {
            Response::builder()
                .status(StatusCode::OK)
                .header("Content-Type", MIME_TYPE)
                .body(data)
                .unwrap()
        }).unwrap_or_else(|_error| {
            Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body("Sealed json encryption error".into())
                .unwrap()
        })
}
