extern crate literium;
extern crate time;

use literium::base::TimeStamp;

fn main() {
    let ts = TimeStamp::now();
    let ms: i64 = ts.into();
    println!("unix: {}, {}, {:?}", ms / 1000, ms, time::get_time());
    println!("rfc2822: {}", ts.format(&TimeStamp::RFC2822).unwrap());
    println!("rfc3339: {}", ts.format(&TimeStamp::ISO8601).unwrap());
    println!(
        "parse: {:?}",
        TimeStamp::parse(&"Sun, 11 Nov 2018 16:25:22 +0500", &TimeStamp::RFC2822).unwrap()
    );
    println!(
        "parse: {:?}",
        TimeStamp::parse(&"2018-11-11T16:25:22+0500", &TimeStamp::ISO8601).unwrap()
    );
    println!(
        "parse: {:?}",
        TimeStamp::parse(&"2018-11-11T16:25:22Z", &TimeStamp::ISO8601).unwrap()
    );
    println!(
        "parse: {:?}",
        TimeStamp::parse(&"1.2.1990", &"%d.%m.%Y")
            .unwrap()
            .format(&TimeStamp::RFC2822)
            .unwrap()
    );
    println!(
        "parse: {:?}",
        TimeStamp::parse(&"01.02.1990", &"%d.%m.%Y")
            .unwrap()
            .format(&TimeStamp::RFC2822)
            .unwrap()
    );
    println!(
        "parse: {:?}",
        TimeStamp::parse(&"1.2", &"%d.%m")
            .unwrap()
            .format(&TimeStamp::RFC2822)
            .unwrap()
    );
}
