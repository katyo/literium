/*!

## Filters

The filters which widely used by literium web-framework.

### Extracting base64 encoded sealed JSON body

```
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate literium;
extern crate warp;

use literium::{x_json, encrypt_base64_sealed_json, gen_keys};
use warp::{Filter, post2, path, any, test::request};

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct MyData {
    field: String,
}

fn main() {
    let keys = gen_keys();

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
        .body(encrypt_base64_sealed_json(&src, &keys).unwrap())
        .filter(&app)
        .unwrap();

    assert_eq!(dst, src);

    // missing content-type
    assert_eq!(request()
        .method("POST")
        .path("/sensible/data")
        .body(encrypt_base64_sealed_json(&src, &keys).unwrap())
        .filter(&app)
        .unwrap_err()
        .cause().unwrap().to_string(), "Missing request header \'content-type\'");

    // invalid content-type
    assert_eq!(request()
        .method("POST")
        .path("/sensible/data")
        .header("content-type", "application/json")
        .body(encrypt_base64_sealed_json(&src, &keys).unwrap())
        .filter(&app)
        .unwrap_err()
        .cause().unwrap().to_string(), "Unsupported content-type");
}
```

*/

mod sealed_auth;
mod sealed_json;

pub use self::sealed_auth::*;
pub use self::sealed_json::*;

/// Shortcut for [`base64_sealed_auth`]
pub use self::base64_sealed_auth as x_auth;

/// Shortcut for [`base64_sealed_json`]
pub use self::base64_sealed_json as x_json;
