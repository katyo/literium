/*!

## Generalized listening for both TCP and Unix Domain sockets.

*/

use std::fmt::{Formatter, Result as FmtResult};
use std::fs::remove_file;
use std::io::Error as IoError;
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::path::PathBuf;
use std::str::FromStr;

use futures::Stream;
use serde::{
    de::{self, Deserializer, Visitor},
    Deserialize,
};
use url::{Host, ParseError, Url};

use tokio::{
    io::{AsyncRead, AsyncWrite},
    net::{TcpListener, TcpStream, UnixListener, UnixStream},
};

/**

## Common listen addess type

Listen address which can represent both TCP and Unix socket address.

```
extern crate futures;
extern crate tokio;
extern crate literium;
extern crate warp;
extern crate http;

use futures::{lazy, Future, sync::oneshot::{Sender, channel}};
use tokio::{run, spawn};
use http::StatusCode;
use warp::Filter;
use literium::base::ListenAddr;

fn server(addr: &ListenAddr) -> Sender<()> {
    let (tx, rx) = channel();

    let app = warp::get2()
        .and(warp::path("/"))
        .map(move || {
            warp::reply::with_status("OK", StatusCode::OK)
        });

    let srv = warp::serve(app)
        .serve_incoming(addr.bind_incoming().unwrap());

    spawn(srv.select(rx.map_err(|_| ())).map(|_| ()).map_err(|_| ()));

    tx
}

fn main() {
    run(lazy(|| {
        let stop_tcp = server(&"http://127.0.0.1:8182".parse().unwrap());
        let stop_unix = server(&"file:server.sock".parse().unwrap());

        stop_tcp.send(()).unwrap();
        stop_unix.send(()).unwrap();

        Ok(())
    }));
}
```

*/
#[derive(Debug, Clone)]
pub enum ListenAddr {
    SocketAddr(SocketAddr),
    SocketPath(PathBuf),
}

impl FromStr for ListenAddr {
    type Err = ParseError;

    fn from_str(src: &str) -> Result<Self, Self::Err> {
        let url = Url::parse(src)?;

        if url.has_host() {
            let port = url.port().unwrap_or(80);
            let ip = match url.host().unwrap() {
                Host::Domain("") => IpAddr::V4(Ipv4Addr::new(0, 0, 0, 0)),
                Host::Domain(name) => match Host::parse(name) {
                    Ok(Host::Ipv4(ip)) => IpAddr::V4(ip),
                    Ok(Host::Ipv6(ip)) => IpAddr::V6(ip),
                    _ => return Err(ParseError::InvalidIpv4Address),
                },
                Host::Ipv4(ip) => IpAddr::V4(ip),
                Host::Ipv6(ip) => IpAddr::V6(ip),
            };
            Ok(ListenAddr::SocketAddr(SocketAddr::new(ip, port)))
        } else {
            let path = url.path();
            Ok(ListenAddr::SocketPath(path.into()))
        }
    }
}

struct ListenAddrVisitor;

impl<'de> Visitor<'de> for ListenAddrVisitor {
    type Value = ListenAddr;

    fn expecting(&self, formatter: &mut Formatter) -> FmtResult {
        formatter.write_str("tcp://ip:port or unix:socket/path")
    }

    fn visit_str<E>(self, src: &str) -> Result<Self::Value, E>
    where
        E: de::Error,
    {
        src.parse().map_err(de::Error::custom)
    }
}

impl<'de> Deserialize<'de> for ListenAddr {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_str(ListenAddrVisitor)
    }
}

pub trait AsyncReadWrite: AsyncRead + AsyncWrite {}

impl AsyncReadWrite for TcpStream {}
impl AsyncReadWrite for UnixStream {}

impl ListenAddr {
    pub fn bind_incoming(
        &self,
    ) -> Result<
        Box<Stream<Item = Box<AsyncReadWrite + Send + 'static>, Error = IoError> + Send + 'static>,
        IoError,
    > {
        use self::ListenAddr::*;
        Ok(match self {
            &SocketAddr(ref addr) => {
                debug!("Bind TCP to: {}", addr);
                Box::new(
                    TcpListener::bind(addr)?
                        .incoming()
                        .map(|s| Box::new(s) as Box<AsyncReadWrite + Send>),
                )
            }
            &SocketPath(ref path) => {
                debug!("Bind UNIX to: {:?}", path);
                remove_file(path).unwrap_or(());
                Box::new(
                    UnixListener::bind(path)?
                        .incoming()
                        .map(|s| Box::new(s) as Box<AsyncReadWrite + Send>),
                )
            }
        })
    }
}
