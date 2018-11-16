/*!

## Literium-specific replies

The replies which widely used by literium web-framework.

### Replying with base64 encoded sealed JSON body

```
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate literium;
extern crate warp;

use literium::{reply};
use literium::crypto::{CanDecrypt, CryptoKeys};
use warp::{Filter, get2, path, any, test::request};

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

### Replying with Server-sent events stream

```
extern crate futures;
extern crate warp;
extern crate literium;

use std::time::Duration;
use futures::stream::iter_ok;
use warp::{get2, path, test::request, Filter};
use literium::{
    base::dummy::DummyError,
    reply::{ServerEvent, sse},
};

fn main() {
    let app = get2().and(path("sse")).map(|| {
        let events = iter_ok::<_, DummyError>(vec![
            ServerEvent::from("some message")
                .with_id(12)
                .with_name("chat"),
            ServerEvent::from("other message\nwith next line")
                .with_id(13)
                .with_name("chat")
                .with_retry(Duration::from_millis(3020)),
        ]);
        sse(events)
    });

    let res = request().method("GET").path("/sse").reply(&app).into_body();

    assert_eq!(
        res,
        r#"event: chat
data: some message
id: 12

event: chat
retry: 3020
data: other message
data: with next line
id: 13

"#
    );
}
```

Or using JSON data:

```
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate futures;
extern crate warp;
extern crate literium;

use std::time::Duration;
use futures::stream::iter_ok;
use warp::{get2, path, test::request, Filter};
use literium::{
    base::dummy::DummyError,
    reply::{ServerEvent, ServerEventError, sse_json},
};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
struct ChatMsg {
    text: String,
    time: u32,
}

fn main() {
    let app = get2().and(path("sse")).map(|| {
        let events = iter_ok::<_, ServerEventError<DummyError, _>>(vec![
            ServerEvent::from(ChatMsg { text: "some message".into(), time: 1234567890 })
                .with_id(45)
                .with_name("chat"),
            ServerEvent::from(ChatMsg { text: "next message".into(), time: 1234569708 })
                .with_id(47)
                .with_name("chat")
                .with_retry(Duration::from_millis(5)),
        ]);
        sse_json(events)
    });

    let res = request().method("GET").path("/sse").reply(&app).into_body();

    assert_eq!(
        res,
        r#"event: chat
data: {"text":"some message","time":1234567890}
id: 45

event: chat
retry: 5
data: {"text":"next message","time":1234569708}
id: 47

"#
    );
}
```

*/

mod sealed_json;
mod sse;

pub use self::sealed_json::*;
pub use self::sse::*;

/// Shortcut for [`reply::base64_sealed_json`]
pub use self::base64_sealed_json as x_json;
