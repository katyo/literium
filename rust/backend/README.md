# Literium web-framework backend library

The types and functions for Literium web-framework.

## User authentication (login, sign-in)

1. Client requests server data (`ServerData`) which includes:
   * Server time stamp (`time_stamp: number` unix-time microseconds)
   * Server public key (`public_key: string` base64 sealed-box key)
   * Authentication methods (`auth_method: {name: AuthMethodData}`)
2. Client synchronize self clock with server
3. Client creates authentication request (`AuthRequest`) using:
   * Client time stamp (`time_stamp: number` unix-time microseconds)
   * Client public key (`public_key: string` base64 sealed-box key)
   * User identification data (`user_ident: UserIdentData`) which depends from authentication method
4. Client encrypts authentication request using server public key and sends to server as request body
5. Server receives request body and decrypts authentication data using server secret key
6. Server verifies authentication request in a next way:
   1. Checks time stamp sync
   2. Checks user identification in a way depending from authentication method
7. Server creates session data (`SessionData`) which includes:
   * Client public key (`public_key: binary`)
   * Unique session token (`token: binary`)
   * Session serial (`serial: number`) with 1 as initial value which increments on each request
   * Session create time (`ctime: number`)
   * Session access time (`atime: number`)
8. Server creates authentication response (`AuthResponse`) which includes:
   * User id (`user: number`)
   * Session id (`session: number`)
   * Session token (`token: string` base64)
   * Extra application-dependent user data (user roles, real user name and etc.)
9. Server encrypts authentication response using client public key and sends to client
10. Client receives authentication response and decrypt it using client secret key
11. Client stores authentication data for identified requests

## User identification (authorization)

1. Client creates identification data (`AuthData`) using:
   * User identifier (`user: number`)
   * Session identifier (`session: number`)
   * Session token (`token: string` base64)
   * Incremented serial (`serial: number`)
2. Client encrypts identification data using server public key and sends it to server as *X-Auth* header
3. Server receives *X-Auth* header and decrypts identification token using server secret key
4. Server verifies identification data in a next way:
   1. Gets session data (`SessionData`) by session and user identifiers
   2. Checks access time
   3. Checks equality of received and stored session token
   4. Checks equality of received serial and stored serial
5. Server increments and stores new serial in session data
6. Server gets user data and returns to application

## Access control

In order to simplify access control in applications the role-based permissions management is used.

It means that:

* Each user has one or several roles
* Each role has some permissions
* Each permission controls access to some resource in some way
* User has some permission when it has a role which has this permission

## Authentication methods

### Native authentication

This is a simplest method which uses only username and password.

1. Server data: nothing
2. User identification data:
  * User name (`username: string`)
  * Password (`password: string`)

### OAuth2 authentication

This method uses user accounts on third party services which implements OAuth2 technology.

1. Server data: (`name: data{}`)
  * Service name
  * Service data
2. User identification data:
   * OAuth2 token
