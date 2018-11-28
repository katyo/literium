use std::error::Error;
use std::fmt::{self, Display, Formatter};
use std::net::{AddrParseError, IpAddr};
use std::ops::{Deref, DerefMut};
use std::slice::{Iter, IterMut};
use std::str::FromStr;
use std::vec::IntoIter;
use unicase::Ascii;

/// The content of "X-Forwarded-For" header
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct XForwardedFor(Vec<IpAddr>);

impl XForwardedFor {
    /// Into vector of ip addresses
    pub fn into_for(self) -> Vec<IpAddr> {
        self.0
    }
}

impl AsRef<[IpAddr]> for XForwardedFor {
    fn as_ref(&self) -> &[IpAddr] {
        self.0.as_ref()
    }
}

impl Deref for XForwardedFor {
    type Target = Vec<IpAddr>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for XForwardedFor {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<'a, I> From<&'a I> for XForwardedFor
where
    &'a I: IntoIterator<Item = &'a IpAddr>,
{
    fn from(ips: &'a I) -> Self {
        XForwardedFor(ips.into_iter().cloned().collect())
    }
}

impl IntoIterator for XForwardedFor {
    type Item = IpAddr;
    type IntoIter = IntoIter<Self::Item>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.into_iter()
    }
}

impl<'a> IntoIterator for &'a XForwardedFor {
    type Item = &'a IpAddr;
    type IntoIter = Iter<'a, IpAddr>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.iter()
    }
}

impl<'a> IntoIterator for &'a mut XForwardedFor {
    type Item = &'a mut IpAddr;
    type IntoIter = IterMut<'a, IpAddr>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.iter_mut()
    }
}

impl Display for XForwardedFor {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        let mut it = self.0.iter();

        if let Some(addr) = it.next() {
            addr.fmt(f)?;
        }

        for addr in it {
            f.write_str(", ")?;
            addr.fmt(f)?;
        }

        Ok(())
    }
}

impl FromStr for XForwardedFor {
    type Err = AddrParseError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        s.split(',')
            .map(|s| s.trim().parse())
            .collect::<Result<Vec<_>, _>>()
            .map(XForwardedFor)
    }
}

#[derive(Debug)]
pub enum ForwardedError {
    BadAddr(AddrParseError),
    BadProto,
    BadToken,
}

impl Error for ForwardedError {}

impl Display for ForwardedError {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        use self::ForwardedError::*;
        match self {
            BadAddr(error) => error.fmt(f),
            BadProto => f.write_str("Invalid proto"),
            BadToken => f.write_str("Unexpected token"),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ForwardedId {
    Addr(IpAddr, Option<u16>),
    Name(String),
}

impl From<IpAddr> for ForwardedId {
    fn from(addr: IpAddr) -> Self {
        ForwardedId::Addr(addr, None)
    }
}

impl From<(IpAddr, u16)> for ForwardedId {
    fn from((addr, port): (IpAddr, u16)) -> Self {
        ForwardedId::Addr(addr, Some(port))
    }
}

impl From<String> for ForwardedId {
    fn from(name: String) -> Self {
        ForwardedId::Name(name)
    }
}

impl<'a> From<&'a str> for ForwardedId {
    fn from(name: &'a str) -> Self {
        Self::from(name.to_string())
    }
}

impl Display for ForwardedId {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        match self {
            ForwardedId::Addr(addr, port) => {
                match addr {
                    IpAddr::V4(addr) => addr.fmt(f)?,
                    IpAddr::V6(addr) => {
                        "\"[".fmt(f)?;
                        addr.fmt(f)?;
                        ']'.fmt(f)?;
                    }
                }
                if let Some(port) = port {
                    ':'.fmt(f)?;
                    port.fmt(f)?;
                }
                if let IpAddr::V6(_) = addr {
                    '"'.fmt(f)?;
                }
            }
            ForwardedId::Name(name) => {
                '"'.fmt(f)?;
                name.fmt(f)?;
                '"'.fmt(f)?;
            }
        }
        Ok(())
    }
}

impl FromStr for ForwardedId {
    type Err = ForwardedError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let s = if s.starts_with('"') && s.ends_with('"') {
            &s[1..s.len() - 1]
        } else {
            s
        };

        {
            let addr = s;
            let addr = if addr.starts_with('[') && addr.ends_with(']') {
                &addr[1..addr.len() - 1]
            } else {
                addr
            };

            if let Ok(addr) = addr.parse() {
                return Ok(ForwardedId::Addr(addr, None));
            }
        }

        let mut p = s.rsplitn(2, ':');

        let (addr, port) = match (p.next(), p.next()) {
            (Some(port), Some(addr)) => (
                addr,
                if let Ok(port) = port.parse() {
                    Some(port)
                } else {
                    None
                },
            ),
            (Some(addr), None) => (addr, None),
            _ => return Err(ForwardedError::BadToken),
        };

        let addr = if addr.starts_with('[') && addr.ends_with(']') {
            &addr[1..addr.len() - 1]
        } else {
            addr
        };

        if let Ok(addr) = addr.parse() {
            return Ok(ForwardedId::Addr(addr, port));
        }

        Ok(ForwardedId::Name(s.to_string()))
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ForwardedHost(String);

impl From<String> for ForwardedHost {
    fn from(name: String) -> Self {
        ForwardedHost(name)
    }
}

impl<'a> From<&'a str> for ForwardedHost {
    fn from(name: &'a str) -> Self {
        Self::from(name.to_string())
    }
}

impl Display for ForwardedHost {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        '"'.fmt(f)?;
        self.0.fmt(f)?;
        '"'.fmt(f)
    }
}

impl FromStr for ForwardedHost {
    type Err = ForwardedError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let s = if s.starts_with('"') && s.ends_with('"') {
            &s[1..s.len() - 1]
        } else {
            s
        };

        Ok(ForwardedHost(s.to_string()))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ForwardedProto {
    #[serde(rename = "http")]
    Http,
    #[serde(rename = "https")]
    Https,
}

impl Display for ForwardedProto {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        f.write_str(match self {
            ForwardedProto::Http => "http",
            ForwardedProto::Https => "https",
        })
    }
}

impl FromStr for ForwardedProto {
    type Err = ForwardedError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(match s {
            "http" => ForwardedProto::Http,
            "https" => ForwardedProto::Https,
            _ => return Err(ForwardedError::BadProto),
        })
    }
}

/// Item of "Forwarded" header
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ForwardedItem {
    /// The "for" parameter
    #[serde(rename = "for")]
    pub for_: ForwardedId,
    /// The "by" parameter
    pub by: Option<ForwardedId>,
    /// The "host" parameter
    pub host: Option<ForwardedHost>,
    /// The "proto" parameter
    pub proto: Option<ForwardedProto>,
}

impl ForwardedItem {
    /// Add "by" parameter
    pub fn with_by<T>(mut self, by: T) -> Self
    where
        ForwardedId: From<T>,
    {
        self.by = Some(ForwardedId::from(by));
        self
    }

    /// Remove "by" parameter
    pub fn without_by(mut self) -> Self {
        self.by = None;
        self
    }

    /// Add "proto" parameter
    pub fn with_proto<T>(mut self, proto: T) -> Self
    where
        ForwardedProto: From<T>,
    {
        self.proto = Some(ForwardedProto::from(proto));
        self
    }

    /// Remove "proto" parameter
    pub fn without_proto(mut self) -> Self {
        self.proto = None;
        self
    }

    /// Add "host" parameter
    pub fn with_host<T>(mut self, host: T) -> Self
    where
        ForwardedHost: From<T>,
    {
        self.host = Some(ForwardedHost::from(host));
        self
    }

    /// Remove "host" parameter
    pub fn without_host(mut self) -> Self {
        self.host = None;
        self
    }
}

impl From<ForwardedId> for ForwardedItem {
    fn from(id: ForwardedId) -> Self {
        Self {
            for_: id,
            by: None,
            host: None,
            proto: None,
        }
    }
}

impl From<IpAddr> for ForwardedItem {
    fn from(addr: IpAddr) -> Self {
        Self::from(ForwardedId::from(addr))
    }
}

impl From<(IpAddr, u16)> for ForwardedItem {
    fn from((addr, port): (IpAddr, u16)) -> Self {
        Self::from(ForwardedId::from((addr, port)))
    }
}

impl From<String> for ForwardedItem {
    fn from(name: String) -> Self {
        Self::from(ForwardedId::from(name))
    }
}

impl<'a> From<&'a str> for ForwardedItem {
    fn from(name: &'a str) -> Self {
        Self::from(name.to_string())
    }
}

impl Display for ForwardedItem {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        "for=".fmt(f)?;
        self.for_.fmt(f)?;

        if let Some(by) = &self.by {
            "; by=".fmt(f)?;
            by.fmt(f)?;
        }

        if let Some(proto) = &self.proto {
            "; proto=".fmt(f)?;
            proto.fmt(f)?;
        }

        if let Some(host) = &self.host {
            "; host=\"".fmt(f)?;
            host.fmt(f)?;
            '"'.fmt(f)?;
        }

        Ok(())
    }
}

impl FromStr for ForwardedItem {
    type Err = ForwardedError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut for_ = None;
        let mut by = None;
        let mut proto = None;
        let mut host = None;

        for ent in s.split(';') {
            let mut it = ent.splitn(2, '=');

            match (it.next(), it.next()) {
                (Some(key), Some(val)) => {
                    let key = key.trim();
                    let val = val.trim();

                    if key == Ascii::new("for") {
                        for_ = Some(val);
                    } else if key == Ascii::new("by") {
                        by = Some(val.parse()?);
                    } else if key == Ascii::new("host") {
                        host = Some(val.parse()?);
                    } else if key == Ascii::new("proto") {
                        proto = Some(val.parse()?);
                    }
                }
                (Some(val), None) => {
                    for_ = Some(val);
                }
                _ => return Err(ForwardedError::BadToken),
            }
        }

        for_.ok_or_else(|| ForwardedError::BadToken)
            .and_then(|for_| for_.parse())
            .map(|for_| ForwardedItem {
                for_,
                by,
                proto,
                host,
            })
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Forwarded(Vec<ForwardedItem>);

impl Forwarded {
    /// Into vector of ip addresses
    pub fn into_for(self) -> Vec<ForwardedId> {
        self.0.iter().map(|entry| entry.for_.clone()).collect()
    }
}

impl AsRef<[ForwardedItem]> for Forwarded {
    fn as_ref(&self) -> &[ForwardedItem] {
        self.0.as_ref()
    }
}

impl Deref for Forwarded {
    type Target = Vec<ForwardedItem>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for Forwarded {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<'a, I> From<&'a I> for Forwarded
where
    &'a I: IntoIterator<Item = &'a ForwardedItem>,
{
    fn from(ips: &'a I) -> Self {
        Forwarded(ips.into_iter().cloned().map(ForwardedItem::from).collect())
    }
}

impl IntoIterator for Forwarded {
    type Item = ForwardedItem;
    type IntoIter = IntoIter<Self::Item>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.into_iter()
    }
}

impl<'a> IntoIterator for &'a Forwarded {
    type Item = &'a ForwardedItem;
    type IntoIter = Iter<'a, ForwardedItem>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.iter()
    }
}

impl<'a> IntoIterator for &'a mut Forwarded {
    type Item = &'a mut ForwardedItem;
    type IntoIter = IterMut<'a, ForwardedItem>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.iter_mut()
    }
}

impl Display for Forwarded {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        let mut it = self.0.iter();

        if let Some(item) = it.next() {
            item.fmt(f)?;
        }

        for item in it {
            f.write_str(", ")?;
            item.fmt(f)?;
        }

        Ok(())
    }
}

impl FromStr for Forwarded {
    type Err = ForwardedError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        s.split(',')
            .map(|s| s.trim().parse())
            .collect::<Result<Vec<_>, _>>()
            .map(Forwarded)
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn parse_x_forwarded_for() {
        assert_eq!(
            "123.34.67.89".parse::<XForwardedFor>().unwrap().into_for(),
            vec![IpAddr::from([123, 34, 67, 89])]
        );

        assert_eq!(
            "192.0.2.43, 2001:db8:cafe::17"
                .parse::<XForwardedFor>()
                .unwrap()
                .into_for(),
            vec![
                IpAddr::from([192, 0, 2, 43]),
                IpAddr::V6("2001:db8:cafe::17".parse().unwrap())
            ]
        );

        assert!("123.34.567.89".parse::<XForwardedFor>().is_err());
        assert!(
            "123.34.567.89; 2001:db8:cafe::17"
                .parse::<XForwardedFor>()
                .is_err()
        );
    }

    #[test]
    fn format_x_forwarded_for() {
        assert_eq!(
            XForwardedFor::from(&[IpAddr::from([123, 34, 67, 89])]).to_string(),
            "123.34.67.89"
        );

        assert_eq!(
            XForwardedFor::from(&[
                IpAddr::from([192, 0, 2, 43]),
                IpAddr::V6("2001:db8:cafe::17".parse().unwrap())
            ]).to_string(),
            "192.0.2.43, 2001:db8:cafe::17"
        );
    }

    #[test]
    fn parse_forwarded() {
        assert_eq!(
            "123.34.67.89".parse::<Forwarded>().unwrap(),
            Forwarded::from(&[IpAddr::from([123, 34, 67, 89]).into()])
        );

        assert_eq!(
            "192.0.2.43, 2001:db8:cafe::17"
                .parse::<Forwarded>()
                .unwrap(),
            Forwarded::from(&[
                IpAddr::from([192, 0, 2, 43]).into(),
                IpAddr::V6("2001:db8:cafe::17".parse().unwrap()).into(),
            ])
        );

        assert_eq!(
            "for=123.34.67.89".parse::<Forwarded>().unwrap(),
            Forwarded::from(&[IpAddr::from([123, 34, 67, 89]).into()])
        );

        assert_eq!(
            "For=192.0.2.43,FOR=2001:db8:cafe::17"
                .parse::<Forwarded>()
                .unwrap(),
            Forwarded::from(&[
                IpAddr::from([192, 0, 2, 43]).into(),
                IpAddr::V6("2001:db8:cafe::17".parse().unwrap()).into(),
            ])
        );

        assert_eq!(
            "for=\"_mdn\"".parse::<Forwarded>().unwrap(),
            Forwarded::from(&["_mdn".into()])
        );

        assert_eq!(
            "For=\"[2001:db8:cafe::17]:4711\""
                .parse::<Forwarded>()
                .unwrap(),
            Forwarded::from(&[(IpAddr::V6("2001:db8:cafe::17".parse().unwrap()), 4711).into()])
        );

        assert_eq!(
            "for=192.0.2.60; proto=http; by=203.0.113.43"
                .parse::<Forwarded>()
                .unwrap(),
            Forwarded::from(&[ForwardedItem::from(IpAddr::from([192, 0, 2, 60]))
                .with_by(IpAddr::from([203, 0, 113, 43]))
                .with_proto(ForwardedProto::Http)])
        );

        assert_eq!(
            "for=192.0.2.43, for=\"[2001:db8:cafe::17]\""
                .parse::<Forwarded>()
                .unwrap(),
            Forwarded::from(&[
                IpAddr::from([192, 0, 2, 43]).into(),
                IpAddr::V6("2001:db8:cafe::17".parse().unwrap()).into(),
            ])
        );
    }

    #[test]
    fn format_forwarded() {
        assert_eq!(
            Forwarded::from(&[IpAddr::from([123, 34, 67, 89]).into()]).to_string(),
            "for=123.34.67.89",
        );

        assert_eq!(
            Forwarded::from(&[
                IpAddr::from([192, 0, 2, 43]).into(),
                IpAddr::from([127, 0, 0, 1]).into(),
            ]).to_string(),
            "for=192.0.2.43, for=127.0.0.1",
        );

        assert_eq!(
            Forwarded::from(&[
                IpAddr::from([192, 0, 2, 43]).into(),
                IpAddr::V6("2001:db8:cafe::17".parse().unwrap()).into(),
            ]).to_string(),
            "for=192.0.2.43, for=\"[2001:db8:cafe::17]\"",
        );

        assert_eq!(
            Forwarded::from(&["_mdn".into()]).to_string(),
            "for=\"_mdn\"",
        );

        assert_eq!(
            Forwarded::from(&[(IpAddr::V6("2001:db8:cafe::17".parse().unwrap()), 4711).into()])
                .to_string(),
            "for=\"[2001:db8:cafe::17]:4711\"",
        );

        assert_eq!(
            Forwarded::from(&[ForwardedItem::from(IpAddr::from([192, 0, 2, 60]))
                .with_by(IpAddr::from([203, 0, 113, 43]))
                .with_proto(ForwardedProto::Http)]).to_string(),
            "for=192.0.2.60; by=203.0.113.43; proto=http",
        );

        assert_eq!(
            Forwarded::from(&[
                IpAddr::from([192, 0, 2, 43]).into(),
                IpAddr::V6("2001:db8:cafe::17".parse().unwrap()).into(),
            ]).to_string(),
            "for=192.0.2.43, for=\"[2001:db8:cafe::17]\"",
        );
    }
}
