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
    use base::timestamp::{TimeStamp, ISO8601, RFC2822};

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
            let dst = ts.format(&ISO8601).map_err(ser::Error::custom)?;
            serializer.serialize_str(&dst)
        }

        pub fn deserialize<'de, D>(deserializer: D) -> Result<TimeStamp, D::Error>
        where
            D: Deserializer<'de>,
        {
            let src: &str = Deserialize::deserialize(deserializer)?;
            TimeStamp::parse(&src, &ISO8601).map_err(de::Error::custom)
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
            let dst = ts.format(&RFC2822).map_err(ser::Error::custom)?;
            serializer.serialize_str(&dst)
        }

        pub fn deserialize<'de, D>(deserializer: D) -> Result<TimeStamp, D::Error>
        where
            D: Deserializer<'de>,
        {
            let src: &str = Deserialize::deserialize(deserializer)?;
            TimeStamp::parse(&src, &RFC2822).map_err(de::Error::custom)
        }
    }
}
