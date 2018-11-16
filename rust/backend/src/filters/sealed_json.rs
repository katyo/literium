use bytes::Buf;
use crypto::{CanDecrypt, CryptoError, HasSecretKey};
use mime::Mime;
use serde::de::DeserializeOwned;
use warp::{
    any,
    body::{concat, FullBody},
    header,
    reject::custom,
    Filter, Rejection,
};

const MIME_SUBTYPE: &str = "x-base64-sealed-json";

/** Decrypt BASE64 encoded sealed JSON body

`Content-Type` header should ends with "x-base64-sealed-json". For example: `Content-Type: application/x-base64-sealed-json`.

```
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate literium;
extern crate warp;
extern crate pretty_env_logger;

use literium::{x_json,
    crypto::{CanEncrypt, CryptoKeys}
};
use warp::{Filter, post2, path, any, test::request};

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct MyData {
    field: String,
}

fn main() {
    pretty_env_logger::init();

    let keys = CryptoKeys::default();

    let app = post2()
        .and(path("sensible"))
        .and(path("data"))
        // extract encrypted body
        .and(x_json(keys.clone()));

    let src = MyData { field: "abcdef".into() };

    let dst: MyData = request()
        .method("POST")
        .path("/sensible/data")
        .header("content-type", "application/x-base64-sealed-json")
        .body(keys.seal_json_b64(&src).unwrap())
        .filter(&app)
        .unwrap();

    assert_eq!(dst, src);

    // missing content-type
    assert_eq!(request()
        .method("POST")
        .path("/sensible/data")
        .body(keys.seal_json_b64(&src).unwrap())
        .filter(&app)
        .unwrap_err()
        .cause().unwrap().to_string(), "Missing request header \'content-type\'");

    // invalid content-type
    assert_eq!(request()
        .method("POST")
        .path("/sensible/data")
        .header("content-type", "application/json")
        .body(keys.seal_json_b64(&src).unwrap())
        .filter(&app)
        .unwrap_err()
        .cause().unwrap().to_string(), "Unsupported content-type");
}
```

*/
pub fn x_json<T, S>(state: S) -> impl Filter<Extract = (T,), Error = Rejection> + Clone
where
    T: DeserializeOwned + Send,
    S: HasSecretKey + Send + Clone,
{
    let state = any().map(move || state.clone());

    any()
        .and(header("content-type"))
        .and_then(|mime: Mime| {
            if mime.subtype() == MIME_SUBTYPE || mime
                .suffix()
                .map(|sfx| sfx == MIME_SUBTYPE)
                .unwrap_or(false)
            {
                Ok(())
            } else {
                Err(custom(CryptoError::BadMime))
            }
        }).and(concat())
        .and(state)
        .and_then(|_, body: FullBody, state: S| {
            (state.as_ref() as &S::SecretKey)
                .open_json_b64(body.bytes())
                .map_err(custom)
        })
}
