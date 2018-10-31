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
use literium::base64;

#[derive(Debug, PartialEq, Eq, Serialize, Deserialize)]
struct MyDoc {
    raw: Vec<u8>,
    #[serde(with = "base64")]
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

use super::{AsBinary, FromBinary};
use base64lib::{decode, encode};
use serde::{de, Deserialize, Deserializer, Serializer};

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
    let s = <&str>::deserialize(deserializer)?;
    decode(s).map_err(de::Error::custom).and_then(|b| {
        T::from_binary(b.as_ref()).ok_or_else(|| de::Error::custom("Invalid value size"))
    })
}
