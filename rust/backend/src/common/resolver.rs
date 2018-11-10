use futures::{Future, Poll};
use std::io::Error;
use std::net::IpAddr;
use std::vec::IntoIter;
#[cfg(feature = "http_client")]
use hyper::client::connect::dns::{Resolve, Name};
use trust_dns_resolver::{
    config::{ResolverConfig, ResolverOpts, LookupIpStrategy},
    system_conf::read_system_conf,
    lookup_ip::{LookupIpFuture},
    Background,
    AsyncResolver
};
use tokio::spawn;
use TimeStamp;

/// Resolver servers to use
#[derive(Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum ResolverServers {
    #[serde(rename = "system")]
    System,
    #[serde(rename = "google")]
    Google,
    #[serde(rename = "cloudflare")]
    Cloudflare,
    #[serde(rename = "quad9")]
    Quad9,
}

impl Default for ResolverServers {
    fn default() -> Self {
        ResolverServers::System
    }
}

impl Into<Option<ResolverConfig>> for ResolverServers {
    fn into(self) -> Option<ResolverConfig> {
        use self::ResolverServers::*;
        match self {
            System => None,
            Google => Some(ResolverConfig::google()),
            Cloudflare => Some(ResolverConfig::cloudflare()),
            Quad9 => Some(ResolverConfig::quad9()),
        }
    }
}

/// Resolver strategy to use
#[derive(Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum ResolverStrategy {
    #[serde(rename = "ipv4")]
    Ipv4,
    #[serde(rename = "ipv6")]
    Ipv6,
    #[serde(rename = "ipv4&ipv6")]
    Ipv4andIpv6,
    #[serde(rename = "ipv6|ipv4")]
    Ipv6orIpv4,
    #[serde(rename = "ipv4|ipv6")]
    Ipv4orIpv6,
}

impl Default for ResolverStrategy {
    fn default() -> Self {
        ResolverStrategy::Ipv4orIpv6
    }
}

impl Into<LookupIpStrategy> for ResolverStrategy {
    fn into(self) -> LookupIpStrategy {
        use self::ResolverStrategy::*;
        match self {
            Ipv4 => LookupIpStrategy::Ipv4Only,
            Ipv6 => LookupIpStrategy::Ipv6Only,
            Ipv4andIpv6 => LookupIpStrategy::Ipv4AndIpv6,
            Ipv6orIpv4 => LookupIpStrategy::Ipv6thenIpv4,
            Ipv4orIpv6 => LookupIpStrategy::Ipv4thenIpv6,
        }
    }
}

/// Resolver options
#[derive(Clone, Serialize, Deserialize)]
pub struct ResolverOptions {
    /// Resolver configuration
    ///
    /// Use system name servers by default.
    pub servers: ResolverServers,

    /// Resolve strategy
    ///
    /// By default query for Ipv4 if that fails, query for Ipv6
    pub strategy: ResolverStrategy,

    /// Resolve timeout
    ///
    /// Default: 5000 mS
    pub timeout: TimeStamp,

    /// Resolve attempts
    ///
    /// Default: 2
    pub attempts: u8,

    /// Use hosts
    ///
    /// Default: true
    pub hosts: bool,

    /// Cache size
    ///
    /// Default: 32
    pub cache: usize,
}

impl Default for ResolverOptions {
    fn default() -> Self {
        Self {
            servers: ResolverServers::default(),
            strategy: ResolverStrategy::default(),
            timeout: TimeStamp::default().with_secs(5),
            attempts: 2,
            hosts: true,
            cache: 32,
        }
    }
}

impl Into<(ResolverConfig, ResolverOpts)> for ResolverOptions {
    fn into(self) -> (ResolverConfig, ResolverOpts) {
        if let Some(conf) = self.servers.into() {
            let mut opts = ResolverOpts::default();
            opts.timeout = self.timeout.into();
            opts.attempts = self.attempts as usize;
            opts.ip_strategy = self.strategy.into();
            opts.cache_size = self.cache;
            opts.use_hosts_file = self.hosts;
            (conf, opts)
        } else {
            let (conf, mut opts) = read_system_conf().unwrap();
            if self.timeout != TimeStamp::default().with_secs(5) {
                opts.timeout = self.timeout.into();
            }
            if self.attempts != 2 {
                opts.attempts = self.attempts as usize;
            }
            if self.strategy != ResolverStrategy::default() {
                opts.ip_strategy = self.strategy.into();
            }
            if self.cache != 32 {
                opts.cache_size = self.cache;
            }
            if !self.hosts {
                opts.use_hosts_file = self.hosts;
            }
            (conf, opts)
        }
    }
}

/// Domain name resolver
#[derive(Clone)]
pub struct NameResolver(AsyncResolver);

impl NameResolver {
    /// Create resolver using options
    pub fn new(options: ResolverOptions) -> Self {
        let (conf, opts) = options.into();
        let (client, service) = AsyncResolver::new(conf, opts);

        spawn(service);
        
        NameResolver(client)
    }

    /// Get ip addresses associated with name
    pub fn get_addrs<S: AsRef<str>>(&self, name: S) -> AddrsFuture {
        AddrsFuture(self.0.lookup_ip(name.as_ref()))
    }
}

/// Ip addresses resolve future
pub struct AddrsFuture(Background<LookupIpFuture>);

impl Future for AddrsFuture {
    type Item = IntoIter<IpAddr>;
    type Error = Error;

    fn poll(&mut self) -> Poll<Self::Item, Self::Error> {
        self.0.poll()
              .map(|state| state.map(|resp| resp.iter()
                   .map(|addr| addr.into()).collect::<Vec<IpAddr>>().into_iter()))
              .map_err(|error| error.into())
    }
}

#[cfg(feature = "http_client")]
impl Resolve for NameResolver {
    type Addrs = IntoIter<IpAddr>;
    type Future = AddrsFuture;

    fn resolve(&self, name: Name) -> Self::Future {
        self.get_addrs(name.as_str())
    }
}
