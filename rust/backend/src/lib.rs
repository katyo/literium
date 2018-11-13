#[macro_use]
extern crate log;
extern crate base64 as base64lib;
extern crate bytes;
extern crate serde;
extern crate time;
#[macro_use]
extern crate serde_derive;
#[cfg(feature = "send_mail")]
extern crate emailmessage;
extern crate futures;
extern crate http;
#[cfg(feature = "http_client")]
extern crate hyper;
#[cfg(feature = "http_client")]
extern crate hyper_tls;
extern crate mime;
#[cfg(feature = "http_client")]
extern crate native_tls;
#[cfg(feature = "send_mail")]
extern crate new_tokio_smtp;
extern crate serde_json;
extern crate serde_qs;
extern crate serde_with;
extern crate sodiumoxide;
extern crate supercow;
extern crate tokio;
extern crate toml;
#[cfg(feature = "name_resolver")]
extern crate trust_dns_resolver;
extern crate url;
extern crate warp;

#[macro_use]
mod common;
pub mod access;
#[cfg(feature = "auth")]
pub mod auth;
pub mod crypto;
pub mod filters;
pub mod reply;
pub mod third;
pub mod user;

#[cfg(feature = "send_mail")]
pub mod mail;
#[cfg(feature = "send_mail")]
pub use mail::{HasMailAddress, MailAddress};

pub use self::access::{HasUserRoles, IsUserRole};
#[cfg(feature = "name_resolver")]
pub use self::common::NameResolver;
pub use self::common::{
    dummy, serde_extra, BoxFuture, CanAccept, CanUpdateFrom, FileConfig, IsBackend, ListenAddr,
    TimeStamp, ISO8601, RFC2822,
};
#[cfg(feature = "http_client")]
pub use self::common::{
    request, HasHttpClient, HttpBody, HttpChunk, HttpClient, HttpRequest, HttpResponse,
    IsHttpClient,
};

pub use self::crypto::{
    open_x_json, random_bytes, seal_x_json, CryptoKeys, HasPublicKey, HasSecretKey, PublicKey,
    SecretKey,
};

#[cfg(feature = "auth")]
pub use self::filters::x_auth;
pub use self::filters::x_json;

#[cfg(test)]
mod test {
    //use tokio::{net::UnixListener, run};
    use warp::*;

    #[test]
    fn test() {
        let root = path::end();
        let blog = path("blog");
        let post = blog.and(path::param::<u32>());

        let root = root.map(|| "Root");
        let blog = blog.and(path::end()).map(|| "Blog posts");
        let post = post
            .and(path::end())
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
