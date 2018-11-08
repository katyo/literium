use crypto::{encrypt_base64_sealed_json, HasPublicKey};
use http::{Response, StatusCode};
use serde::Serialize;
use warp::Reply;

const MIME_TYPE: &str = "application/x-base64-sealed-json";

/// Reply with base64 encoded sealed JSON body
///
/// `Content-Type` header will be set to "application/x-base64-sealed-json"
pub fn base64_sealed_json<T, S>(data: T, state: S) -> impl Reply
where
    T: Serialize,
    S: HasPublicKey,
{
    encrypt_base64_sealed_json(data, state.as_ref())
        .map_err(|error| {
            error!("Failed to encrypt sealed json: {:?}", error);
            error
        }).map(|data| {
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
