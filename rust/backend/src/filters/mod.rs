/*!

## Literium-specific filters

The filters which widely used by literium web-framework.

### Extracting base64 encoded sealed JSON body

```
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate literium;
extern crate warp;
extern crate pretty_env_logger;

use literium::{x_json, CanEncrypt, CryptoKeys};
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

### Using base64 encoded sealed json authorization

```
extern crate futures;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate literium;
extern crate warp;
#[macro_use]
extern crate log;
extern crate pretty_env_logger;

use futures::Future;
use literium::{
    user::{
        dummy::{UserData, Users},
        HasUserAccess,
    },
    auth::{
        dummy::{Sessions, UserAuth},
        AuthData, HasUserAuth, HasSessionAccess, IsSessionAccess,
    },
    x_auth, CanEncrypt, CryptoKeys, HasSecretKey, PublicKey,
};
use std::sync::Arc;
use warp::{get2, path, test::request, Filter};

#[derive(Clone)]
pub struct State {
    config: Arc<CryptoKeys>,
    users: Users,
    sessions: Sessions,
}

impl AsRef<CryptoKeys> for State {
    fn as_ref(&self) -> &CryptoKeys {
        &self.config
    }
}

impl HasSecretKey for State {
    type SecretKey = CryptoKeys;
}

impl AsRef<Users> for State {
    fn as_ref(&self) -> &Users {
        &self.users
    }
}

impl HasUserAccess for State {
    type UserAccess = Users;
}

impl AsRef<Sessions> for State {
    fn as_ref(&self) -> &Sessions {
        &self.sessions
    }
}

impl HasSessionAccess for State {
    type SessionAccess = Sessions;
}

impl HasUserAuth for State {
    type UserAuth = UserAuth;
}

fn main() {
    pretty_env_logger::init();

    let server_keys = CryptoKeys::default();

    let client_keys = CryptoKeys::default();

    let user = UserData::new(1, "yumi");

    let users = Users::new().with_user(user.clone());

    let sessions = Sessions::new();

    let session = sessions
        .new_user_session(user.id, (client_keys.as_ref() as &PublicKey).clone())
        .wait()
        .unwrap();

    let state = State {
        config: Arc::new(server_keys),
        users,
        sessions,
    };

    let auth_data = AuthData {
        user: user.id,
        sess: 1,
        token: session.token.clone(),
        serno: session.serno,
    };
    let auth_header = (&state.as_ref() as &CryptoKeys).seal_json_b64(&auth_data).unwrap();

    let app = get2()
        .and(path("sensible"))
        .and(path("data"))
        // get auth
        .and(x_auth(state.clone()))
        .map(|user: UserAuth| user.name.clone());

    let name = request()
        .method("GET")
        .path("/sensible/data")
        .header("x-auth", auth_header)
        .filter(&app)
        .unwrap();

    assert_eq!(name, user.name);
}
```

*/

#[cfg(feature = "auth")]
mod sealed_auth;
mod sealed_json;

#[cfg(feature = "auth")]
pub use self::sealed_auth::base64_sealed_auth;
pub use self::sealed_json::base64_sealed_json;

/// Shortcut for [`base64_sealed_auth`]
#[cfg(feature = "auth")]
pub use self::base64_sealed_auth as x_auth;

/// Shortcut for [`base64_sealed_json`]
pub use self::base64_sealed_json as x_json;
