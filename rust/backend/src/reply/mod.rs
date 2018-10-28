/*!

## Replies

The replies which widely used by literium web-framework.

### Replying with base64 encoded sealed JSON body

```
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate literium;
extern crate warp;

use literium::{reply, decrypt_base64_sealed_json, gen_keys};
use warp::{Filter, get2, path, any, test::request};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
struct MyData {
    field: String,
}

fn main() {
    let keys = gen_keys();

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
        .map(|body| decrypt_base64_sealed_json(&body, keys))
        .into_body()
        .unwrap();

    assert_eq!(dst, src);
}
```

*/

mod sealed_json;

pub use self::sealed_json::*;

/// Shortcut for [`reply::base64_sealed_json`]
pub use self::base64_sealed_json as x_json;
