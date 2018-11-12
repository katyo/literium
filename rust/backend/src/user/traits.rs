use super::{AccountId, UserId};
use std::borrow::Cow;
use {BoxFuture, IsBackend};

/// Basic user data
pub trait IsUserData: Sized {
    /// Get unique user identifier
    fn user_id(&self) -> UserId;

    /// Get unique user name
    fn user_name(&self) -> &str;

    /// Create user data using unique name
    fn from_name<'a, S: Into<Cow<'a, str>>>(name: S) -> Self;
}

/// User data which has password
pub trait HasPasswordHash {
    type PasswordHash: AsRef<[u8]>;

    fn get_password_hash(&self) -> Option<&Self::PasswordHash>;
    fn set_password_hash<S: AsRef<[u8]>>(&mut self, new: Option<S>);
}

/// Access to user data
pub trait IsUserAccess: IsBackend {
    /// User data type
    type User: IsUserData + Send + 'static;

    /// Get user data by name
    fn find_user_data<'a, S: Into<Cow<'a, str>>>(
        &self,
        name: S,
    ) -> BoxFuture<Option<Self::User>, Self::Error>;

    /// Get user data by id
    fn get_user_data(&self, user: UserId) -> BoxFuture<Option<Self::User>, Self::Error>;

    /// Save user data
    fn put_user_data(&self, user: Self::User) -> BoxFuture<Self::User, Self::Error>;
}

/// State has access to user data
pub trait HasUserAccess
where
    Self: AsRef<<Self as HasUserAccess>::UserAccess>,
{
    /// User data accessor
    type UserAccess: IsUserAccess;
}
