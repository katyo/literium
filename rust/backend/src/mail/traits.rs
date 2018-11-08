use super::{MailMessage, MailerError};
use futures::future;
use BoxFuture;

/// The generic mailer interface
pub trait IsMailer {
    fn send_mail(&self, message: MailMessage) -> BoxFuture<(), MailerError>;
}

/// Dummy mailer
impl IsMailer for () {
    fn send_mail(&self, _message: MailMessage) -> BoxFuture<(), MailerError> {
        Box::new(future::ok(()))
    }
}

/// Backend has mail sending features
pub trait HasMailer
where
    Self: AsRef<<Self as HasMailer>::Mailer>,
{
    type Mailer: IsMailer;
}
