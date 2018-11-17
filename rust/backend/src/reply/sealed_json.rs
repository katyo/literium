use crypto::{CanEncrypt, HasPublicKey};
use http::StatusCode;
use httplib::Response;
use serde::Serialize;
use warp::{reject::custom, Reply};

const MIME_TYPE: &str = "application/x-base64-sealed-json";

/** Reply with BASE64 encoded sealed JSON body

This function converts serializable data into reply with BASE64 encoded sealed JSON body.

`Content-Type` header will be set to "application/x-base64-sealed-json".

```
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate literium;
extern crate warp;

use warp::{Filter, get2, path, any, test::request};
use literium::{
    reply,
    crypto::{CanDecrypt, CryptoKeys}
};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
struct MyData {
    field: String,
}

fn main() {
    let keys = CryptoKeys::default();

    let src = MyData { field: "abcdef".into() };

    let app = get2()
        .and(path("sensible"))
        .and(path("data"))
        // reply with encrypted body
        .map({
             let src = src.clone();
             let keys = keys.clone();
             move || reply::x_json(&src, &keys)
        });

    let dst: MyData = request()
        .method("GET")
        .path("/sensible/data")
        .reply(&app)
        .map(|body| keys.open_json_b64(&body))
        .into_body()
        .unwrap();

    assert_eq!(dst, src);
}
```

*/
pub fn x_json<T, S>(data: &T, state: &S) -> impl Reply
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
