extern crate futures;
extern crate literium;
extern crate pretty_env_logger;
extern crate tokio;

use futures::lazy;
use futures::Future;
use literium::{
    base::FileConfig,
    mail::{IsMailer, MailMessage, SmtpConfig, SmtpMailer},
};
use std::time::Duration;
use tokio::{clock::now, run, timer::Delay};

fn main() {
    pretty_env_logger::init();

    run(lazy(|| {
        let mailer = {
            let config = FileConfig::<SmtpConfig>::load("Smtp.toml").unwrap();
            config.save().unwrap();
            SmtpMailer::new(&config).unwrap()
        };

        let message = MailMessage::create()
            .to("Кай <kayo@illumium.org>".parse().unwrap())
            .subject("Тестовое сообщение!")
            .body("Привет мир.".into());

        let message2 = MailMessage::create()
            .to("Кай <kayo@illumium.org>".parse().unwrap())
            .subject("Тестовое сообщение2")
            .body("Привет мир2.".into());

        mailer
            .send_mail(message)
            // artifical delay
            .then(|_| Delay::new(now() + Duration::from_secs(4)))
            .then(move |_| mailer.send_mail(message2))
            .then(|_| Delay::new(now() + Duration::from_secs(6)))
            .then(|_| Ok(()))
    }));
}
