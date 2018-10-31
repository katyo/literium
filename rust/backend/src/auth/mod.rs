/*!

## Authorization and authentication basics

### User authorization (login, sign-in)

1. Client requests auth info from server ([`AuthInfo`](auth::AuthInfo)) which includes:
   * Server timestamp ([`ctime`](auth::AuthInfo::ctime): *number* unix-time in microseconds)
   * Server public key ([`pbkey`](auth::AuthInfo::pbkey): *string* base64 sealed-box key)
   * Authentication methods ([`authm`](auth::AuthInfo::authm): *{\[method_name: string\]: [`MethodInfo`](auth::AuthInfo::MethodInfo)}*)
2. Client synchronize self clock with server
3. Client creates authentication request ([`AuthRequest`](auth::AuthRequest)) using:
   * Client time stamp ([`ctime`](auth::AuthRequest::ctime): *number* unix-time microseconds)
   * Client public key ([`pbkey`](auth::AuthRequest::pbkey): *string* base64 sealed-box key)
   * User identification data ([`ident`](auth::AuthRequest::ident): *Value*) which depends from authentication method
4. Client encrypts authentication request using server public key and sends to server as request body
5. Server receives request body and decrypts authentication data using server secret key
6. Server verifies authentication request in a next way:
   1. Checks time stamp synchronization (absolute delta between server time less than three seconds)
   2. Checks user identification in a way depending from authentication method
   3. Checks that session for this user with same timestamp doesn't already created
7. Server creates session data ([`SessionData`](auth::SessionData)) which includes:
   * Client public key ([`pbkey`](auth::SessionData::pbkey): *binary*)
   * Unique session token ([`token`](auth::SessionData::pbkey): *binary*)
   * Session serial ([`serno`](auth::SessionData::serno): *number*) with 1 as initial value which increments on each authorized request
   * Session create time ([`ctime`](auth::SessionData::ctime): *number*) which contains client time stamp
   * Session access time ([`atime`](auth::SessionData::atime): *number*)
8. Server creates authentication response ([`AuthResponse`](auth::AuthResponse)) which includes:
   * User id ([`user`](auth::AuthResponse::user): *number*)
   * Session id ([`sess`](auth::AuthResponse::sess): *number*)
   * Session token ([`token`](auth::AuthResponse::token): *string* base64-encoded binary data)
   * Extra application-dependent user data (user roles, real user name and etc.)
9. Server encrypts authentication response using client public key and sends to client
10. Client receives authentication response and decrypt it using client secret key
11. Client stores authentication data for identified requests

### User authentication (identification)

1. Client creates authentication data ([`AuthData`](auth::AuthData)) using:
   * User identifier ([`user`](auth::AuthData::user): *number*)
   * Session identifier ([`sess`](auth::AuthData::sess): *number*)
   * Session token ([`token`](auth::AuthData::token): *string* base64-encoded binary data)
   * Incremented serial ([`serno`](auth::AuthData::serno): *number*)
2. Client encrypts authentication data using server public key and sends it to server as *X-Auth* header
3. Server receives *X-Auth* header and decrypts authentication token using server secret key
4. Server verifies authentication data in a next way:
   1. Gets session data ([`SessionData`](auth::SessionData)) by session and user identifiers
   2. Checks access time ([`atime`](auth::SessionData::ctime)) to prevent use of outdated sessions
   3. Checks equality of received session token ([`token`](auth::AuthData::token)) and stored session token ([`token`](auth::SessionData::token))
   4. Checks equality of received serial ([`serno`](auth::AuthData::serno)) and stored serial ([`serno`](auth::SessionData::serno))
5. Server increments and stores new serial in session data ([`serno`](auth::SessionData::serno)
6. Server gets user data ([`HasUserData::UserData`](auth::HasUserData::UserData))
7. Server creates user auth ([`HasUserAuth::AuthData`](auth::HasUserAuth::AuthData)) with application-dependent session and user info and returns back to the application

*/

pub mod dummy;
mod error;
mod handler;
pub mod method;
mod traits;
mod types;

pub use self::error::*;
pub use self::handler::*;
pub use self::method::{HasAuthMethod, IsAuthMethod};
pub use self::traits::*;
pub use self::types::*;
