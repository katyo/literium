#[macro_use]
extern crate log;
extern crate base64 as base64lib;
extern crate bytes;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate futures;
extern crate http;
extern crate mime;
extern crate serde_json;
extern crate sodiumoxide;
extern crate supercow;
extern crate tokio;
extern crate toml;
extern crate url;
extern crate warp;

#[macro_use]
pub mod access;
mod auth;
pub mod base64;
mod binary;
mod config;
mod crypto;
pub mod filters;
pub mod reply;
mod timestamp;

pub use self::access::*;
pub use self::auth::*;
pub use self::binary::*;
pub use self::config::*;
pub use self::crypto::*;
pub use self::filters::*;
pub use self::timestamp::*;

#[cfg(test)]
mod test {
    //use tokio::{net::UnixListener, run};
    use warp::*;

    #[test]
    fn test() {
        let root = index();
        let blog = path("blog");
        let post = blog.and(path::param::<u32>());

        let root = root.map(|| "Root");
        let blog = blog.and(index()).map(|| "Blog posts");
        let post = post
            .and(index())
            .map(|id: u32| format!("Blog post #{}", id));

        let all = root.or(blog).unify().map(String::from).or(post).unify();

        assert_eq!(
            &test::request()
                .method("GET")
                .path("/")
                .filter(&all)
                .unwrap(),
            "Root"
        );

        assert_eq!(
            &test::request()
                .method("GET")
                .path("/blog")
                .filter(&all)
                .unwrap(),
            "Blog posts"
        );

        assert_eq!(
            &test::request()
                .method("GET")
                .path("/blog/123")
                .filter(&all)
                .unwrap(),
            "Blog post #123"
        );

        //let server = serve(all);
        //run(server.serve_incoming(UnixListener::bind("sock").unwrap().incoming()));
    }
}
