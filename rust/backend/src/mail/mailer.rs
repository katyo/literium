use super::{
    HasMailer, IsMailer, MailMessage, Mailbox, Mailboxes, MailerError, SmtpAuth, SmtpConfig,
    SmtpSecurity,
};
use emailmessage::header;
use {BoxFuture, HasConfig};

use bytes::IntoBuf;
use futures::{
    future::{loop_fn, ok, Either, Loop},
    sync::{mpsc, oneshot},
    Future, Sink, Stream,
};
use new_tokio_smtp::{
    chain::{chain, OnError},
    command::{
        auth::{Login, Plain},
        Data, Mail, Noop, Recipient,
    },
    error::MissingCapabilities,
    Cmd, Connection, ConnectionConfig, DefaultTlsSetup, EhloData, ExecFuture, ForwardPath, Io,
    ReversePath, DEFAULT_SMTP_MSA_PORT,
};
use std::io;
use std::net::SocketAddr;
use std::time::Duration;
use tokio::{clock::now, spawn, timer::Delay};

/// Send email message
pub fn send_mail<State>(state: State, message: MailMessage) -> BoxFuture<(), MailerError>
where
    State: HasConfig,
    State::Config: HasMailer,
{
    state.get_config().get_mailer().send_mail(message)
}

/// SMTP mailer
pub struct SmtpMailer {
    // From/Sender header to override it in outgoing messages
    from: Option<Mailbox>,
    // sender accept message and 'complete' sender
    sender: mpsc::Sender<(MailMessage, oneshot::Sender<()>)>,
}

impl SmtpMailer {
    /// Create SMTP mailer using configuration
    pub fn new(config: &SmtpConfig) -> Result<Self, MailerError> {
        let conn_conf = make_conn_conf(&config)?;
        let from = config.from.clone();

        let (sender, receiver) = mpsc::channel(10);

        let keep = if config.keep.is_zero() {
            info!("Start mailer");
            None
        } else {
            let keep: Duration = config.keep.into();
            info!("Start mailer with keep timeout: {:?}", keep);
            Some(keep)
        };

        spawn(make_mail_proc(conn_conf, receiver, keep).map(|_| {
            info!("Stop mailer");
        }));

        Ok(SmtpMailer { from, sender })
    }
}

impl IsMailer for SmtpMailer {
    fn send_mail(&self, mut message: MailMessage) -> BoxFuture<(), MailerError> {
        let (result_sender, result_receiver) = oneshot::channel();

        if let Some(from) = &self.from {
            // Change `From:` header
            let headers = message.headers_mut();
            headers.set(header::From(Mailboxes::new().with(from.clone())));
        }

        info!("Queue email to send");
        debug!("\n{}", message.headers());

        Box::new(
            self.sender
                .clone()
                .send((message, result_sender))
                .map_err(|_| MailerError::ServerError)
                .join(result_receiver.map_err(|_| MailerError::ServerError))
                .map(|_| ()),
        )
    }
}

fn make_mail_proc(
    conf: ConnConf,
    recv: mpsc::Receiver<(MailMessage, oneshot::Sender<()>)>,
    keep: Option<Duration>,
) -> impl Future<Item = (), Error = ()> + Send {
    loop_fn((recv, None, None), move |(recv, conn, outgoing)| {
        if let Some(conn) = conn {
            // has connection
            if let Some(outgoing) = outgoing {
                // has outgoing message => send email
                Either::A(Either::A(send_mail_message(conn, outgoing).then(
                    |res| match res {
                        Ok(conn) => Ok(Loop::Continue((recv, Some(conn), None))),
                        Err(_) => Ok(Loop::Continue((recv, None, None))),
                    },
                )))
            } else {
                // no outgoing message
                if let Some(keep) = keep {
                    // await outgoing messages with keep timeout
                    Either::A(Either::B(Either::A(
                        recv.into_future()
                            .select2(Delay::new(now() + keep))
                            .map(move |outgoing_or_timeout| match outgoing_or_timeout {
                                // has outgoing => do send
                                Either::A(((outgoing, recv), _keep_timer)) => {
                                    if let Some(outgoing) = outgoing {
                                        Loop::Continue((recv, Some(conn), Some(outgoing)))
                                    } else {
                                        // closed outgoing channel => stop mailer
                                        Loop::Break(())
                                    }
                                }
                                // timeout reached => drop connection
                                Either::B((_, recv_future)) => {
                                    if let Some(recv) = recv_future.into_inner() {
                                        // closing connection
                                        debug!("Close connection: timeout");
                                        Loop::Continue((recv, None, None))
                                    } else {
                                        // stop mailer
                                        Loop::Break(())
                                    }
                                }
                            }).or_else(|error| {
                                Ok(match error {
                                    // broken outgoing channel => stop mailer
                                    Either::A(_) => Loop::Break(()),
                                    // timer error => stop mailer
                                    Either::B((error, _)) => {
                                        error!("Timer error: {}", error);
                                        Loop::Break(())
                                    }
                                })
                            }),
                    )))
                } else {
                    // closing connection
                    debug!("Close connection: unused");
                    Either::A(Either::B(Either::B(ok(Loop::Continue((recv, None, None))))))
                }
            }
        } else {
            // connection closed
            if let Some(outgoing) = outgoing {
                // connect and send message
                debug!("Establish connection");
                Either::B(Either::A(conf.clone().connect().then(|result| {
                    Ok(match result {
                        Ok(conn) => {
                            debug!("Connection established");
                            Loop::Continue((recv, Some(conn), Some(outgoing)))
                        }
                        Err(error) => {
                            error!("Connecting error: {}", error);
                            Loop::Continue((recv, None, None))
                        }
                    })
                })))
            } else {
                // no outgoing => await outgoing
                Either::B(Either::B(
                    recv.into_future()
                        .map(move |(outgoing, recv)| {
                            if let Some(outgoing) = outgoing {
                                // has outgoing => connect and send
                                Loop::Continue((recv, None, Some(outgoing)))
                            } else {
                                // closed outgoing channel => stop mailer
                                Loop::Break(())
                            }
                        }).or_else(|_| {
                            // broken outgoing channel => stop mailer
                            Ok(Loop::Break(()))
                        }),
                ))
            }
        }
    })
}

fn send_mail_message(
    conn: Connection,
    (message, result_sender): (MailMessage, oneshot::Sender<()>),
) -> impl Future<Item = Connection, Error = ()> {
    let mut cmds = Vec::new();

    {
        let header::From(from) = message.headers().get().unwrap();
        let header::To(tos) = message.headers().get().unwrap();

        let reverse_path =
            ReversePath::from_unchecked(from.iter().next().unwrap().email.to_string());
        cmds.push(Mail::new(reverse_path).boxed());

        for to in tos.iter() {
            let forward_path = ForwardPath::from_unchecked(to.email.to_string());
            cmds.push(Recipient::new(forward_path).boxed());
        }
    }

    info!("Send email message");
    debug!("\n{}", message.headers());

    cmds.push(
        Data::new(
            message
                .into_stream()
                .map(|bytes| bytes.into_buf())
                .map_err(|error| io::Error::new(io::ErrorKind::InvalidData, error)),
        ).boxed(),
    );

    chain(conn, cmds, OnError::StopAndReset)
        .and_then(|(conn, result)| {
            match result {
                Ok(_) => {
                    let _ = result_sender.send(());
                }
                Err((_, error)) => {
                    error!("Mailer error: {}", error);
                }
            }
            Ok(conn)
        }).map_err(|error| {
            error!("Mailer error: {}", error);
        })
}

type ConnConf = ConnectionConfig<
    EitherCmd<EitherCmd<Noop, SelectCmd<Plain, Login>>, EitherCmd<Login, Plain>>,
    DefaultTlsSetup,
>;

fn make_conn_conf(config: &SmtpConfig) -> Result<ConnConf, MailerError> {
    let host = config
        .host
        .parse()
        .map_err(|error| MailerError::BadConfig(format!("Invalid host: {}", error)))?;

    let port = if let Some(port) = config.port {
        port
    } else {
        DEFAULT_SMTP_MSA_PORT
    };

    // create builder
    let builder = if let Some(addr) = config.addr {
        ConnectionConfig::builder_with_addr(SocketAddr::new(addr, port), host)
    } else {
        ConnectionConfig::builder_with_port(host, port)
            .map_err(|error| MailerError::BadConfig(format!("Unable to setup: {}", error)))?
    };

    // setup security
    let builder = if let Some(tls) = config.tls {
        match tls {
            SmtpSecurity::StartTls => builder.use_start_tls(),
            SmtpSecurity::Ssl => builder.use_direct_tls(),
        }
    } else {
        builder
    };

    // setup auth
    let builder = if let (Some(user), Some(pass)) = (&config.user, &config.pass) {
        if let Some(auth) = config.auth {
            // use plain or login auth method
            match auth {
                SmtpAuth::Plain => {
                    let plain =
                        Plain::from_username(user.as_str(), pass.as_str()).map_err(|error| {
                            MailerError::BadConfig(format!("Invalid username/password: {}", error))
                        })?;
                    builder.auth(EitherCmd::B(EitherCmd::B(plain)))
                }
                SmtpAuth::Login => {
                    let login = Login::new(user, pass);
                    builder.auth(EitherCmd::B(EitherCmd::A(login)))
                }
            }
        } else {
            // auto select plain or login auth method
            let plain = Plain::from_username(user.as_str(), pass.as_str()).map_err(|error| {
                MailerError::BadConfig(format!("Invalid username/password: {}", error))
            })?;
            let login = Login::new(user, pass);

            builder.auth(EitherCmd::A(EitherCmd::B(SelectCmd(plain, login))))
        }
    } else {
        // no auth (for using with local smtp server)
        builder.auth(EitherCmd::A(EitherCmd::A(Noop)))
    };

    Ok(builder.build())
}

#[derive(Debug, Clone)]
enum EitherCmd<A, B> {
    A(A),
    B(B),
}

impl<A, B> Cmd for EitherCmd<A, B>
where
    A: Cmd,
    B: Cmd,
{
    fn check_cmd_availability(&self, caps: Option<&EhloData>) -> Result<(), MissingCapabilities> {
        match self {
            EitherCmd::A(a) => a.check_cmd_availability(caps),
            EitherCmd::B(b) => b.check_cmd_availability(caps),
        }
    }
    fn exec(self, con: Io) -> ExecFuture {
        match self {
            EitherCmd::A(a) => a.exec(con),
            EitherCmd::B(b) => b.exec(con),
        }
    }
}

#[derive(Debug, Clone)]
struct SelectCmd<A, B>(A, B);

impl<A, B> Cmd for SelectCmd<A, B>
where
    A: Cmd,
    B: Cmd,
{
    fn check_cmd_availability(&self, caps: Option<&EhloData>) -> Result<(), MissingCapabilities> {
        self.0.check_cmd_availability(caps)?;
        self.1.check_cmd_availability(caps)
    }
    fn exec(self, con: Io) -> ExecFuture {
        if self.0.check_cmd_availability(con.ehlo_data()).is_ok() {
            Box::new(self.0.exec(con))
        } else {
            Box::new(self.1.exec(con))
        }
    }
}
