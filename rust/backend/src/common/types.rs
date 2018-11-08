use futures::Future;

/// Boxed future type
pub type BoxFuture<Val, Err> = Box<Future<Item = Val, Error = Err> + Send>;
