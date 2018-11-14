extern crate literium;
extern crate time;

use literium::base::{TimeStamp, ISO8601, RFC2822};

fn main() {
    let ts = TimeStamp::now();
    let ms: i64 = ts.into();
    println!("unix: {}, {}, {:?}", ms / 1000, ms, time::get_time());
    println!("rfc2822: {}", ts.format(&RFC2822).unwrap());
    println!("rfc3339: {}", ts.format(&ISO8601).unwrap());
    println!(
        "parse: {:?}",
        TimeStamp::parse(&"Sun, 11 Nov 2018 16:25:22 +0500", &RFC2822).unwrap()
    );
    println!(
        "parse: {:?}",
        TimeStamp::parse(&"2018-11-11T16:25:22+0500", &ISO8601).unwrap()
    );
    println!(
        "parse: {:?}",
        TimeStamp::parse(&"2018-11-11T16:25:22Z", &ISO8601).unwrap()
    );
}
