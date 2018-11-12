use super::{AccountId, Gender, UserId};
use std::borrow::Cow;
use url::Url;
use {BoxFuture, IsBackend, MailAddress, TimeStamp};

/// Basic user data
pub trait IsUserData: Sized {
    /// Get unique user identifier
    fn get_user_id(&self) -> UserId;

    /// Get unique user name
    fn get_user_name(&self) -> &str;

    /// Get unique user name
    fn set_user_name<S: Into<String>>(&mut self, name: S);

    /// Create user data using unique name
    fn create_new<S: Into<String>>(name: S) -> Self;
}

/// User data which has password
pub trait HasPasswordHash {
    fn get_password_hash(&self) -> Option<&[u8]>;
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
