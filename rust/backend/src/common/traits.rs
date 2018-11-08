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
