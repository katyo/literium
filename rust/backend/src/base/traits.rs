use super::{BoxFuture, DummyError, EitherError};
use futures::{future::ok, Future};
use serde::{de::DeserializeOwned, Serialize};
use std::error::Error;

/// Trait which provides generic backend types
pub trait IsBackend {
    type Error: Error + Send + 'static;
}

/// Backend can accept event notification
pub trait CanAccept<Event> {
    /// Handle notification
    fn on_event(&self, _event: Event) {}

    /// Send notification
    #[inline]
    fn emit_event(&self, event: Event) {
        self.on_event(event);
    }
}

/// Update something from something other
pub trait CanUpdateFrom<T> {
    fn update_from(&mut self, data: &T);
}

/// The ability to create viewable representation of data
pub trait CanCreateView<A, V> {
    type View: Serialize + Send + 'static;

    fn create_view(&self, auth: &A) -> Self::View;
}

/// The ability to update data from viewable representation of data
pub trait CanUpdateData<A, V> {
    type View: DeserializeOwned + Send + 'static;

    fn update_data(&mut self, auth: &A, view: &Self::View);
}

/// The addon for resource
pub trait IsAddon<S, R>
where
    R: Send + 'static,
{
    type Error: Error + Send + 'static;

    fn on_load(&self, _state: &S, resource: R) -> BoxFuture<R, Self::Error> {
        Box::new(ok(resource))
    }

    fn on_save(&self, _state: &S, resource: R) -> BoxFuture<R, Self::Error> {
        Box::new(ok(resource))
    }
}

impl<'a, S, R, A> IsAddon<S, R> for &'a A
where
    R: Send + 'static,
    A: IsAddon<S, R>,
{
    type Error = A::Error;

    fn on_load(&self, state: &S, resource: R) -> BoxFuture<R, Self::Error> {
        (*self).on_load(state, resource)
    }

    fn on_save(&self, state: &S, resource: R) -> BoxFuture<R, Self::Error> {
        (*self).on_save(state, resource)
    }
}

impl<S, R> IsAddon<S, R> for ()
where
    R: Send + 'static,
{
    type Error = DummyError;
}

macro_rules! error_type {
    ($a:ident, $b:ident) => {
        EitherError<$a::Error, $b::Error>
    };
    ($a:ident, $($b:ident),+) => {
        EitherError<$a::Error, error_type!($($b),+)>
    };
}

macro_rules! on_event {
    ($self:expr, $state:expr, $resource:expr, $event:ident, $i:tt, $j:tt) => {
        $self.$i
             .$event($state, $resource)
             .map_err(EitherError::A)
             .and_then({
                 let this = $self.clone();
                 move |resource|
                 this.$j
                      .$event($state, resource)
                      .map_err(EitherError::B)
             })
    };
    ($self:expr, $state:expr, $resource:expr, $event:ident, $i:tt, $($j:tt),+) => {
        $self.$i
             .$event($state, $resource)
             .map_err(EitherError::A)
             .and_then({
                 let this = $self.clone();
                 move |resource|
                 on_event!(this, $state, resource, $event, $($j),+)
                     .map_err(EitherError::B)
             })
    };
}

macro_rules! tuple_addon {
    ( ($($type:ident),+) => ($($index:tt),+) ) => {
        impl<S, R, $($type),+> IsAddon<S, R> for ($($type),+)
        where
            Self: Send + Clone,
            S: Send + Sync + Clone + 'static,
            R: Send + 'static,
            $($type: IsAddon<S, R> + Sync + 'static),+
        {
            type Error = error_type!($($type),+);

            fn on_load(&self, state: &S, resource: R) -> BoxFuture<R, Self::Error> {
                let state = state.clone();
                Box::new(on_event!(self, &state, resource, on_load, $($index),+))
            }

            fn on_save(&self, state: &S, resource: R) -> BoxFuture<R, Self::Error> {
                let state = state.clone();
                Box::new(on_event!(self, &state, resource, on_save, $($index),+))
            }
        }
    };
}

tuple_addon!((A, B) => (0, 1));
tuple_addon!((A, B, C) => (0, 1, 2));
tuple_addon!((A, B, C, D) => (0, 1, 2, 3));
tuple_addon!((A, B, C, D, E) => (0, 1, 2, 3, 4));
tuple_addon!((A, B, C, D, E, F) => (0, 1, 2, 3, 4, 5));
tuple_addon!((A, B, C, D, E, F, G) => (0, 1, 2, 3, 4, 5, 6));
tuple_addon!((A, B, C, D, E, F, G, H) => (0, 1, 2, 3, 4, 5, 6, 7));
/*
tuple_addon!((A, B, C, D, E, F, G, H, I) => (0, 1, 2, 3, 4, 5, 6, 7, 8));
tuple_addon!((A, B, C, D, E, F, G, H, I, J) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9));
tuple_addon!((A, B, C, D, E, F, G, H, I, J, K) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10));
tuple_addon!((A, B, C, D, E, F, G, H, I, J, K, L) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11));
tuple_addon!((A, B, C, D, E, F, G, H, I, J, K, L, M) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12));
tuple_addon!((A, B, C, D, E, F, G, H, I, J, K, L, M, N) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13));
tuple_addon!((A, B, C, D, E, F, G, H, I, J, K, L, M, N, O) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14));
tuple_addon!((A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P) => (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15));
*/
/// Resource has addon
pub trait HasAddon<S>
where
    Self: Send + Sized + 'static,
{
    type Addon: IsAddon<S, Self>;
}
