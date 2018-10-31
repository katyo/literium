use futures::Future;

/// Json value type
pub use serde_json::Value as JsonValue;

/// Boxed future type
pub type BoxFuture<Val, Err> = Box<Future<Item = Val, Error = Err> + Send>;
