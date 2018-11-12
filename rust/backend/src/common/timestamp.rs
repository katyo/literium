use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::ops::{Add, Sub};
use std::time::Duration;
use time::{at_utc, now_utc, strftime, strptime, ParseError, Timespec, Tm};

pub const RFC2822: &str = "%a, %d %b %Y %T %z";
pub const ISO8601: &str = "%Y-%m-%dT%T%z";

/// Unix-time in milliseconds
///
/// This type is intended for compact representation of real time.
/// The values of this type serialized as integer.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Default)]
#[repr(transparent)]
pub struct TimeStamp(i64);

impl TimeStamp {
    /// Create value with current UTC time
    pub fn now() -> Self {
        now_utc().into()
    }

    /// Parse time string using specified format
    pub fn parse<S: AsRef<str>, F: AsRef<str>>(src: &S, fmt: &F) -> Result<Self, ParseError> {
        strptime(src.as_ref(), fmt.as_ref()).map(Self::from)
    }

    /// Format time string using specified format
    pub fn format<F: AsRef<str>>(&self, fmt: &F) -> Result<String, ParseError> {
        strftime(fmt.as_ref(), &(*self).into())
    }

    /// Add microseconds to time
    pub fn with_msecs(self, msecs: i64) -> Self {
        TimeStamp(self.0 + msecs)
    }

    /// Add seconds to time
    pub fn with_secs(self, secs: i32) -> Self {
        self.with_msecs(i64::from(secs) * 1000)
    }

    /// Add minutes to time
    pub fn with_mins(self, mins: i32) -> Self {
        self.with_secs(mins * 60)
    }

    /// Add hours to time
    pub fn with_hours(self, hours: i32) -> Self {
        self.with_mins(hours * 60)
    }

    /// Add days to time
    pub fn with_days(self, days: i32) -> Self {
        self.with_hours(days * 24)
    }

    /// Add months to time
    pub fn with_mons(self, mons: i16) -> Self {
        self.with_days(i32::from(mons) * 30)
    }

    /// Add years to time
    pub fn with_years(self, years: i16) -> Self {
        self.with_days(i32::from(years) * 365)
    }

    /// Absolute value
    pub fn abs(self) -> Self {
        if self.0 < 0 {
            TimeStamp(-self.0)
        } else {
            self
        }
    }

    /// Calculate absolute time difference
    pub fn abs_delta(&self, time: &Self) -> Self {
        (*self - *time).abs()
    }

    /// Check if value is zero
    pub fn is_zero(&self) -> bool {
        self.0 == 0
    }
}

impl Add for TimeStamp {
    type Output = TimeStamp;

    fn add(self, other: Self) -> Self {
        TimeStamp(self.0 + other.0)
    }
}

impl Sub for TimeStamp {
    type Output = TimeStamp;

    fn sub(self, other: Self) -> Self {
        TimeStamp(self.0 - other.0)
    }
}

impl Add<Duration> for TimeStamp {
    type Output = TimeStamp;

    fn add(self, other: Duration) -> Self {
        self + Self::from(other)
    }
}

impl Sub<Duration> for TimeStamp {
    type Output = TimeStamp;

    fn sub(self, other: Duration) -> Self {
        self - Self::from(other)
    }
}

impl From<i64> for TimeStamp {
    fn from(v: i64) -> Self {
        TimeStamp(v)
    }
}

impl Into<i64> for TimeStamp {
    fn into(self) -> i64 {
        self.0
    }
}

impl From<u64> for TimeStamp {
    fn from(v: u64) -> Self {
        TimeStamp(v as i64)
    }
}

impl Into<u64> for TimeStamp {
    fn into(self) -> u64 {
        self.0 as u64
    }
}

impl From<Duration> for TimeStamp {
    fn from(dt: Duration) -> Self {
        (dt.as_secs() * 1000 + dt.subsec_nanos() as u64 / 1000_000).into()
    }
}

impl Into<Duration> for TimeStamp {
    fn into(self) -> Duration {
        Duration::from_millis(self.into())
    }
}

impl From<Tm> for TimeStamp {
    fn from(tm: Tm) -> Self {
        tm.to_timespec().into()
    }
}

impl Into<Tm> for TimeStamp {
    fn into(self) -> Tm {
        at_utc(self.into())
    }
}

impl From<Timespec> for TimeStamp {
    fn from(tm: Timespec) -> Self {
        TimeStamp(tm.sec * 1_000 + (tm.nsec / 1_000_000) as i64)
    }
}

impl Into<Timespec> for TimeStamp {
    fn into(self) -> Timespec {
        let sec = self.0 / 1_000;
        let nsec = (self.0 % 1_000) as i32 * 1_000_000;
        Timespec::new(sec, nsec)
    }
}

impl Serialize for TimeStamp {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        self.0.serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for TimeStamp {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<TimeStamp, D::Error> {
        Deserialize::deserialize(deserializer).map(TimeStamp)
    }
}
