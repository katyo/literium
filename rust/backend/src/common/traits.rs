use std::error::Error;
use std::ops::Deref;
use std::rc::Rc;
use std::sync::Arc;

/// Access to configuration
pub trait HasConfig {
    /// Type of configuration data
    type Config;

    /// Get configuration data
    fn get_config(&self) -> &Self::Config;
}

impl<'a, T: HasConfig> HasConfig for &'a T {
    type Config = T::Config;

    fn get_config(&self) -> &Self::Config {
        (*self).get_config()
    }
}

impl<T: HasConfig> HasConfig for Arc<T> {
    type Config = T::Config;

    fn get_config(&self) -> &Self::Config {
        self.deref().get_config()
    }
}

impl<T: HasConfig> HasConfig for Rc<T> {
    type Config = T::Config;

    fn get_config(&self) -> &Self::Config {
        self.deref().get_config()
    }
}

/// Trait which provides generic backend types
pub trait IsBackend {
    type Error: Error + Send + 'static;
}

/// Access to backend
pub trait HasBackend {
    /// Type of backenduration data
    type Backend: IsBackend;

    /// Get backenduration data
    fn get_backend(&self) -> &Self::Backend;
}

impl<'a, T: HasBackend> HasBackend for &'a T {
    type Backend = T::Backend;

    fn get_backend(&self) -> &Self::Backend {
        (*self).get_backend()
    }
}

impl<T: HasBackend> HasBackend for Arc<T> {
    type Backend = T::Backend;

    fn get_backend(&self) -> &Self::Backend {
        self.deref().get_backend()
    }
}

impl<T: HasBackend> HasBackend for Rc<T> {
    type Backend = T::Backend;

    fn get_backend(&self) -> &Self::Backend {
        self.deref().get_backend()
    }
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
