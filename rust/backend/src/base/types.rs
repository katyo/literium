use futures::Future;
use serde::{
    ser::{SerializeMap, SerializeSeq},
    Deserialize, Deserializer, Serialize, Serializer,
};

/// Empty object to use where object-like (or map-like) parameter required
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EmptyMap;

impl Serialize for EmptyMap {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_map(Some(0))?.end()
    }
}

impl<'de> Deserialize<'de> for EmptyMap {
    fn deserialize<D: Deserializer<'de>>(_deserializer: D) -> Result<Self, D::Error> {
        Ok(EmptyMap)
    }
}

/// Empty object to use where array-like (or sequence-like) parameter required
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EmptySeq;

impl Serialize for EmptySeq {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_seq(Some(0))?.end()
    }
}

impl<'de> Deserialize<'de> for EmptySeq {
    fn deserialize<D: Deserializer<'de>>(_deserializer: D) -> Result<Self, D::Error> {
        Ok(EmptySeq)
    }
}

/// Boxed future type
pub type BoxFuture<Val, Err> = Box<Future<Item = Val, Error = Err> + Send>;
