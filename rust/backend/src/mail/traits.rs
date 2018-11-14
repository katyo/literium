use super::{MailAddress, MailMessage, MailerError};
use base::BoxFuture;
use futures::future;

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

/// Something which has email address
pub trait HasMailAddress {
    fn get_mail_address(&self) -> Option<&MailAddress>;
    fn set_mail_address(&mut self, address: Option<MailAddress>);
}
