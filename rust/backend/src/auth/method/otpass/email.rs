use super::{IsOTPassIdent, IsOTPassSender};
use auth::AuthError;
use base::BoxFuture;
use futures::Future;
use mail::{
    header, HasMailer, IsMailer, MailAddress, MailBody, MailMessage, Mailbox, MultiPart, SinglePart,
};
use std::borrow::Cow;

/// Email message creating
pub trait IsEmailOTPassFormatter<S> {
    /// Create subject of message
    fn subject(&self, _state: &S, _ident: &EmailUserIdent, _password: &str) -> String {
        "Authentication token".into()
    }

    /// Create plain text body
    fn plain_body(&self, _state: &S, _ident: &EmailUserIdent, password: &str) -> String {
        format!(
            "Use the next one-time token for authentication: {}",
            password
        )
    }

    /// Create optional HTML body
    ///
    /// Example: `Some("<p>Use the next one-time token for authentication: {}</p>")`
    fn html_body(&self, _state: &S, _ident: &EmailUserIdent, _password: &str) -> Option<String> {
        None
    }

    /// Create message body
    fn body(&self, state: &S, ident: &EmailUserIdent, password: &str) -> MailBody {
        let plain_body = self.plain_body(state, ident, password);

        if let Some(html_body) = self.html_body(state, ident, password) {
            MultiPart::alternative()
                .singlepart(
                    SinglePart::base64()
                        .header(header::ContentType(
                            "text/html; charset=utf8".parse().unwrap(),
                        )).body(html_body),
                ).singlepart(
                    SinglePart::base64()
                        .header(header::ContentType(
                            "text/plain; charset=utf8".parse().unwrap(),
                        )).body(plain_body),
                ).to_string()
                .into()
        } else {
            SinglePart::base64()
                .header(header::ContentType(
                    "text/plain; charset=utf8".parse().unwrap(),
                )).body(plain_body)
                .to_string()
                .into()
        }
    }
}

/// Built-in email formatter
pub struct EmailOTPassFormatter;

impl<S> IsEmailOTPassFormatter<S> for EmailOTPassFormatter {}

/// Email-based OTP auth info
#[derive(Debug, Serialize)]
pub struct EmailAuthInfo {
    email: bool,
}

/// Email-based OTP user ident
#[derive(Debug, Clone, Serialize, Deserialize, Hash, PartialEq, Eq)]
pub struct EmailUserIdent {
    pub email: MailAddress,
    pub name: String,
}

impl IsOTPassIdent for EmailUserIdent {
    fn get_user_name(&self) -> Cow<str> {
        self.email.to_string().into()
    }
}

/// One-time password sender which uses email
pub struct EmailOTPass<F>(F);

impl<F> EmailOTPass<F> where {
    pub fn new(formatter: F) -> Self {
        EmailOTPass(formatter)
    }
}

impl<S, F> IsOTPassSender<S> for EmailOTPass<F>
where
    S: HasMailer,
    F: IsEmailOTPassFormatter<S>,
{
    type AuthInfo = EmailAuthInfo;
    type UserIdent = EmailUserIdent;

    fn sender_info(&self) -> Self::AuthInfo {
        EmailAuthInfo { email: true }
    }

    fn send_password(
        &self,
        state: &S,
        ident: &Self::UserIdent,
        password: &str,
    ) -> BoxFuture<(), AuthError> {
        let message = MailMessage::create()
            .to(Mailbox::new(Some(ident.name.clone()), ident.email.clone()))
            .subject(self.0.subject(state, ident, password))
            .mime_body(self.0.body(state, ident, password));

        Box::new(
            (state.as_ref() as &S::Mailer)
                .send_mail(message)
                .map_err(|_| AuthError::BackendError)
                .and_then(|_| Err(AuthError::NeedRetry)),
        )
    }
}
