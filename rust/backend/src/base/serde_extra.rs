/*!

## Serialize/Deserialize utilities

*/

use super::{AsBinary, FromBinary};
use serde::{de, ser, Deserialize, Deserializer, Serializer};

/// Check if value equals to default
///
/// The basic use case: `#[serde(skip_serializing_if = "is_default")]`
pub fn is_default<T>(v: &T) -> bool
where
    T: Default + PartialEq,
{
    v == &T::default()
}

pub mod base64 {
    /*!

## Serialize and deserialize binary data as base64 strings

Because deserialization often requires additional checks the [`FromBinary`] trait should be implemented to convert raw binary data into concrete type.

Using with **serde_derive**:

```
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;

extern crate literium;

use serde_json::{to_string, from_str};
use literium::base::serde_extra;

#[derive(Debug, PartialEq, Eq, Serialize, Deserialize)]
struct MyDoc {
    raw: Vec<u8>,
    #[serde(with = "serde_extra::base64")]
    b64: Vec<u8>,
}

fn main() {
    let doc = MyDoc {
        raw: vec![0, 1, 2, 3, 4, 5],
        b64: vec![0, 1, 2, 3, 4, 5]
    };

    let txt = to_string(&doc).unwrap();

    assert_eq!(&txt, r#"{"raw":[0,1,2,3,4,5],"b64":"AAECAwQF"}"#);

    let res = from_str(&txt).unwrap();

    assert_eq!(doc, res);
}
```

*/

    use super::*;
    use base64lib::{decode, encode};

    pub fn serialize<S, T>(bytes: &T, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
        T: AsBinary,
    {
        let b = encode(bytes.as_binary());
        serializer.serialize_str(&b)
    }

    pub fn deserialize<'de, D, T>(deserializer: D) -> Result<T, D::Error>
    where
        D: Deserializer<'de>,
        T: FromBinary + Sized,
    {
        let s: &str = Deserialize::deserialize(deserializer)?;
        decode(s).map_err(de::Error::custom).and_then(|b| {
            T::from_binary(b.as_ref()).ok_or_else(|| de::Error::custom("Invalid value size"))
        })
    }
}

pub mod timestamp {
    /*!

    ### Serde timestamp representations

     */

    use super::*;
    use base::timestamp::TimeStamp;

    pub mod iso8601 {
        /*!
        
        #### Serialize and deserialize timestamps as ISO8601 string

         */

        use super::*;

        pub fn serialize<S, T>(ts: &TimeStamp, serializer: S) -> Result<S::Ok, S::Error>
        where
            S: Serializer,
            T: AsBinary,
        {
            let dst = ts.format(&TimeStamp::ISO8601).map_err(ser::Error::custom)?;
            serializer.serialize_str(&dst)
        }

        pub fn deserialize<'de, D>(deserializer: D) -> Result<TimeStamp, D::Error>
        where
            D: Deserializer<'de>,
        {
            let src: &str = Deserialize::deserialize(deserializer)?;
            TimeStamp::parse(&src, &TimeStamp::ISO8601).map_err(de::Error::custom)
        }
    }

    pub mod rfc2822 {
        /*!
        
        #### Serialize and deserialize timestamps as RFC2822 string

         */

        use super::*;

        pub fn serialize<S, T>(ts: &TimeStamp, serializer: S) -> Result<S::Ok, S::Error>
        where
            S: Serializer,
            T: AsBinary,
        {
            let dst = ts.format(&TimeStamp::RFC2822).map_err(ser::Error::custom)?;
            serializer.serialize_str(&dst)
        }

        pub fn deserialize<'de, D>(deserializer: D) -> Result<TimeStamp, D::Error>
        where
            D: Deserializer<'de>,
        {
            let src: &str = Deserialize::deserialize(deserializer)?;
            TimeStamp::parse(&src, &TimeStamp::RFC2822).map_err(de::Error::custom)
        }
    }
}

/// De/Serialize sequences using [FromIterator] and [IntoIterator] implementation for it and [Display][] and [FromStr][] implementation for each element
///
/// This allows to serialize and deserialize collections with elements which can be represented as strings.
///
/// [FromIterator]: https://doc.rust-lang.org/std/iter/trait.FromIterator.html
/// [IntoIterator]: https://doc.rust-lang.org/std/iter/trait.IntoIterator.html
/// [Display]: https://doc.rust-lang.org/stable/std/fmt/trait.Display.html
/// [FromStr]: https://doc.rust-lang.org/stable/std/str/trait.FromStr.html
///
/// # Examples
///
/// ```
/// # extern crate serde;
/// # #[macro_use]
/// # extern crate serde_derive;
/// # extern crate serde_json;
/// # extern crate literium;
/// # use literium::base::serde_extra::seq_display_fromstr;
/// # use std::net::Ipv4Addr;
/// # use std::collections::BTreeSet;
/// #[derive(Deserialize, Serialize)]
/// struct A {
///     #[serde(with = "seq_display_fromstr")]
///     addresses: BTreeSet<Ipv4Addr>,
///     #[serde(with = "seq_display_fromstr")]
///     bs: Vec<bool>,
/// }
///
/// # fn main() {
/// let v: A = serde_json::from_str(r#"{
///     "addresses": ["192.168.2.1", "192.168.2.2", "192.168.1.1", "192.168.2.2"],
///     "bs": ["true", "false"]
/// }"#).unwrap();
/// assert_eq!(v.addresses.len(), 3);
/// assert!(v.addresses.contains(&Ipv4Addr::new(192, 168, 2, 1)));
/// assert!(v.addresses.contains(&Ipv4Addr::new(192, 168, 2, 2)));
/// assert!(!v.addresses.contains(&Ipv4Addr::new(192, 168, 1, 2)));
/// assert_eq!(v.bs.len(), 2);
/// assert!(v.bs[0]);
/// assert!(!v.bs[1]);
///
/// let x = A {
///     addresses: vec![
///         Ipv4Addr::new(127, 53, 0, 1),
///         Ipv4Addr::new(127, 53, 1, 1),
///         Ipv4Addr::new(127, 53, 0, 2)
///     ].into_iter().collect(),
///     bs: vec![false, true],
/// };
/// assert_eq!(r#"{"addresses":["127.53.0.1","127.53.0.2","127.53.1.1"],"bs":["false","true"]}"#, serde_json::to_string(&x).unwrap());
/// # }
/// ```
pub mod seq_display_fromstr {
    use serde::{
        de::{Deserializer, Error, SeqAccess, Visitor},
        ser::{SerializeSeq, Serializer},
    };
    use std::fmt::{self, Display};
    use std::iter::{FromIterator, IntoIterator};
    use std::marker::PhantomData;
    use std::str::FromStr;

    /// Deserialize collection T using [FromIterator] and [FromStr] for each element
    pub fn deserialize<'de, D, T, I>(deserializer: D) -> Result<T, D::Error>
    where
        D: Deserializer<'de>,
        T: FromIterator<I> + Sized,
        I: FromStr,
        I::Err: Display,
    {
        struct Helper<S>(PhantomData<S>);

        impl<'de, S> Visitor<'de> for Helper<S>
        where
            S: FromStr,
            <S as FromStr>::Err: Display,
        {
            type Value = Vec<S>;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                write!(formatter, "a sequence")
            }

            fn visit_seq<A>(self, mut access: A) -> Result<Self::Value, A::Error>
            where
                A: SeqAccess<'de>,
            {
                let mut values = access
                    .size_hint()
                    .map(Self::Value::with_capacity)
                    .unwrap_or_else(Self::Value::new);

                while let Some(value) = access.next_element::<&str>()? {
                    values.push(value.parse::<S>().map_err(Error::custom)?);
                }

                Ok(values)
            }
        }

        deserializer
            .deserialize_seq(Helper(PhantomData))
            .map(T::from_iter)
    }

    /// Serialize collection T using [IntoIterator] and [Display] for each element
    pub fn serialize<S, T, I>(mimes: &T, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
        for<'a> &'a T: IntoIterator<Item = &'a I>,
        I: Display,
    {
        let iter = mimes.into_iter();
        let (_, to) = iter.size_hint();
        let mut seq = serializer.serialize_seq(to)?;
        for item in iter {
            seq.serialize_element(&item.to_string())?;
        }
        seq.end()
    }
}
