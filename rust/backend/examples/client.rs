extern crate futures;
extern crate http;
extern crate hyper;
extern crate literium;
extern crate pretty_env_logger;
extern crate tokio;

use futures::{lazy, Future, Stream};
use http::Request;
use literium::{
    dns::NameResolver,
    http::{
        client::{HttpClient, IsHttpClient},
        HttpBody,
    },
};
use tokio::run;

fn main() {
    pretty_env_logger::init();

    run(lazy(|| {
        let resolver = NameResolver::new(Default::default());
        let client = HttpClient::new(resolver);

        client
            .send_request(
                Request::get("http://httpbin.org/ip")
                    .body(HttpBody::empty())
                    .unwrap(),
            )
            // And then, if the request gets a response...
            .and_then(|res| {
                println!("status: {}", res.status());

                // Concatenate the body stream into a single buffer...
                // This returns a new future, since we must stream body.
                res.into_body().concat2()
            })
            // And then, if reading the full body succeeds...
            .and_then(|body| {
                let b = body.into_bytes();
                // The body is just bytes, but let's print a string...
                let s = ::std::str::from_utf8(&b).expect("httpbin sends utf-8 JSON");

                println!("body: {}", s);

                // and_then requires we return a new Future, and it turns
                // out that Result is a Future that is ready immediately.
                Ok(())
            })
            // Map any errors that might have happened...
            .map_err(|err| {
                println!("error: {}", err);
            })
    }));
}
