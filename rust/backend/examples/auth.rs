extern crate futures;
extern crate literium;
extern crate pretty_env_logger;
extern crate serde;
extern crate tokio;
extern crate warp;

use futures::lazy;
use literium::{
    auth::{
        do_user_auth,
        dummy::{Sessions, UserInfo},
        get_auth_info,
        method::{EmailOTPass, IsEmailOTPassFormatter, NativeAuth, OTPassAuth},
        HasAuthMethod, HasSessionAccess, HasUserInfo,
    },
    mail::{HasMailer, SmtpConfig, SmtpMailer},
    user::{
        dummy::{UserData, Users},
        HasUserAccess,
    },
    CryptoKeys, HasPublicKey, HasSecretKey,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::run;
use warp::Filter;

pub struct EmailOTPassFormatter;

impl IsEmailOTPassFormatter<State> for EmailOTPassFormatter {}

type AuthMethod = (
    NativeAuth,
    OTPassAuth<State, EmailOTPass<EmailOTPassFormatter>>,
);

pub struct Config {
    server_keys: CryptoKeys,
    auth_method: AuthMethod,
}

#[derive(Clone)]
pub struct State {
    config: Arc<Config>,
    mailer: SmtpMailer,
    users: Users,
    sessions: Sessions,
}

impl AsRef<CryptoKeys> for State {
    fn as_ref(&self) -> &CryptoKeys {
        &self.config.server_keys
    }
}

impl HasPublicKey for State {
    type KeyData = CryptoKeys;
}

impl HasSecretKey for State {
    type KeyData = CryptoKeys;
}

impl AsRef<Users> for State {
    fn as_ref(&self) -> &Users {
        &self.users
    }
}

impl HasUserAccess for State {
    type UserAccess = Users;
}

impl AsRef<Sessions> for State {
    fn as_ref(&self) -> &Sessions {
        &self.sessions
    }
}

impl HasSessionAccess for State {
    type SessionAccess = Sessions;
}

impl AsRef<SmtpMailer> for State {
    fn as_ref(&self) -> &SmtpMailer {
        &self.mailer
    }
}

impl HasMailer for State {
    type Mailer = SmtpMailer;
}

impl AsRef<AuthMethod> for State {
    fn as_ref(&self) -> &AuthMethod {
        &self.config.auth_method
    }
}

impl HasAuthMethod for State {
    type AuthMethod = AuthMethod;
}

impl HasUserInfo for State {
    type UserInfo = UserInfo;
}

fn main() {
    pretty_env_logger::init();

    run(lazy(|| {
        let server_keys = CryptoKeys::gen();

        let auth_method = (
            NativeAuth,
            OTPassAuth::new(EmailOTPass::new(EmailOTPassFormatter), Default::default()),
        );

        let config = Arc::new(Config {
            server_keys,
            auth_method,
        });

        let user = UserData::new(1, "Elene").with_password("secret");

        let users = Users::new().with_user(user);

        let sessions = Sessions::new();

        let mut smtp_config = SmtpConfig::default();
        smtp_config.host = "smtp.gmail.com".into();

        let state = State {
            config,
            mailer: SmtpMailer::new(&smtp_config).unwrap(),
            users,
            sessions,
        };

        let base = warp::path("auth");

        let auth_info = base.clone().and(get_auth_info(state.clone()));

        let auth_user = base.and(do_user_auth(state.clone()));

        let app = auth_info.or(auth_user);

        warp::serve(app).bind("0.0.0.0:8081".parse::<SocketAddr>().unwrap())
    }));
}
