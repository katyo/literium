extern crate futures;
extern crate literium;
extern crate pretty_env_logger;
extern crate serde;
extern crate tokio;
extern crate warp;

use futures::lazy;
use literium::{
    auth::{
        auth_scope,
        dummy::{Sessions, UserAuth},
        native::NativeAuth,
        oauth2::{self, HasOAuth2Providers, OAuth2Auth, OAuth2Options},
        otpass::{EmailOTPass, EmailOTPassFormatter, OTPassAuth},
        HasAuthMethod, HasSessionAccess, HasUserAuth,
    },
    crypto::{CryptoKeys, HasPublicKey, HasSecretKey},
    dns::{NameResolver, ResolverOptions},
    http::client::{HasHttpClient, HttpClient},
    mail::{HasMailer, SmtpConfig, SmtpMailer},
    third::{github, google},
    user::{
        dummy::{Accounts, UserData, Users},
        HasAccountAccess, HasUserAccess,
    },
};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::run;
use warp::Filter;

type AuthMethod = (
    NativeAuth,
    OTPassAuth<State, EmailOTPass<EmailOTPassFormatter>>,
    OAuth2Auth,
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
    accounts: Accounts,
    client: HttpClient<NameResolver>,
    services: Arc<(github::Service, google::Service)>,
}

impl AsRef<CryptoKeys> for State {
    fn as_ref(&self) -> &CryptoKeys {
        &self.config.server_keys
    }
}

impl HasPublicKey for State {
    type PublicKey = CryptoKeys;
}

impl HasSecretKey for State {
    type SecretKey = CryptoKeys;
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

impl AsRef<Accounts> for State {
    fn as_ref(&self) -> &Accounts {
        &self.accounts
    }
}

impl HasAccountAccess for State {
    type AccountAccess = Accounts;
}

impl AsRef<SmtpMailer> for State {
    fn as_ref(&self) -> &SmtpMailer {
        &self.mailer
    }
}

impl AsRef<HttpClient<NameResolver>> for State {
    fn as_ref(&self) -> &HttpClient<NameResolver> {
        &self.client
    }
}

impl HasHttpClient for State {
    type HttpClient = HttpClient<NameResolver>;
}

impl HasMailer for State {
    type Mailer = SmtpMailer;
}

impl AsRef<AuthMethod> for State {
    fn as_ref(&self) -> &AuthMethod {
        &self.config.auth_method
    }
}

impl AsRef<(github::Service, google::Service)> for State {
    fn as_ref(&self) -> &(github::Service, google::Service) {
        &self.services
    }
}

impl HasOAuth2Providers for State {
    type OAuth2Providers = (github::Service, google::Service);
}

impl HasAuthMethod for State {
    type AuthMethod = AuthMethod;
}

impl HasUserAuth for State {
    type UserAuth = UserAuth;
}

fn main() {
    pretty_env_logger::init();

    run(lazy(|| {
        let server_keys = CryptoKeys::default();

        let mut oauth2_options = OAuth2Options::default();

        oauth2_options.services.push(oauth2::ClientOptions {
            name: "github".into(),
            params: oauth2::ClientParams {
                client_id: "github_client_id".into(),
                client_secret: "github_client_secret".into(),
            },
        });

        oauth2_options.services.push(oauth2::ClientOptions {
            name: "google".into(),
            params: oauth2::ClientParams {
                client_id: "google_client_id".into(),
                client_secret: "google_client_secret".into(),
            },
        });

        let auth_method = (
            NativeAuth,
            OTPassAuth::new(EmailOTPass::new(EmailOTPassFormatter), Default::default()),
            OAuth2Auth::new(oauth2_options),
        );

        let config = Arc::new(Config {
            server_keys,
            auth_method,
        });

        let user = UserData::new(1, "Elene").with_password("secret");

        let users = Users::new().with_user(user);

        let sessions = Sessions::new();

        let accounts = Accounts::new();

        let mut smtp_config = SmtpConfig::default();
        smtp_config.host = "smtp.gmail.com".into();

        let state = State {
            config,
            mailer: SmtpMailer::new(&smtp_config).unwrap(),
            users,
            sessions,
            accounts,
            services: Arc::new((
                github::Service::new(github::Config::default()),
                google::Service::new(google::Config::default()),
            )),
            client: HttpClient::new(NameResolver::new(ResolverOptions::default())),
        };

        let base = warp::path("auth");
        let app = base.and(auth_scope(&state));

        warp::serve(app).bind("0.0.0.0:8081".parse::<SocketAddr>().unwrap())
    }));
}
