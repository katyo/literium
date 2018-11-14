use super::{do_user_auth, get_server_data};
use warp::{self, Filter, Reply};

pub fn auth_scope<S>(state: S) -> impl Filter {
    warp::get2()
        .and_then(get_server_data)
        .or(warp::post2().and_then(do_user_auth));
}
