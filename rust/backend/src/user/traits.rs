use super::{AccountId, Gender, UserId};
use base::{BoxFuture, IsBackend, TimeStamp};
use mail::MailAddress;
use std::borrow::Cow;
use url::Url;

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

/// Basic account data type
pub trait IsAccountData {
    /// Get account id
    fn get_account_id(&self) -> AccountId;

    /// Set account id
    fn set_account_id(&mut self, new: AccountId);

    /// Get account name
    fn get_account_name(&self) -> &str;

    /// Set account name
    fn set_account_name<S: Into<String>>(&mut self, name: S);

    /// Get account service
    fn get_account_service(&self) -> &str;

    /// Set account service
    fn set_account_service<S: Into<String>>(&mut self, name: S);

    /// Get user id
    fn get_user_id(&self) -> UserId;

    /// Set user id
    fn set_user_id(&mut self, new: UserId);

    /// Create new with account name
    fn create_new<S: Into<String>>(name: S) -> Self;
}

/// Access to user account
pub trait IsAccountAccess: IsBackend {
    /// Account data type
    type Account: IsAccountData + Send + 'static;

    /// Find account of user
    fn find_user_account<'a, S: Into<Cow<'a, str>>, N: Into<Cow<'a, str>>>(
        &self,
        service: S,
        account: N,
    ) -> BoxFuture<Option<Self::Account>, Self::Error>;

    /// Get account of user
    fn get_user_account(&self, account: AccountId)
        -> BoxFuture<Option<Self::Account>, Self::Error>;

    /// Save user account
    fn put_user_account(
        &self,
        account: Self::Account,
    ) -> BoxFuture<Option<Self::Account>, Self::Error>;
}

/// State has access to user accounts
pub trait HasAccountAccess
where
    Self: AsRef<<Self as HasAccountAccess>::AccountAccess>,
{
    /// Account accessor
    type AccountAccess: IsAccountAccess;
}

/// Account has nick name field
pub trait HasNickName {
    fn get_nick_name(&self) -> Option<&str>;
    fn set_nick_name<T: Into<String>>(&mut self, new: Option<T>);
}

/// Account has full name field
pub trait HasFullName {
    fn get_full_name(&self) -> Option<&str>;
    fn set_full_name<T: Into<String>>(&mut self, new: Option<T>);
}

/// Account has given name field
pub trait HasGivenName {
    fn get_given_name(&self) -> Option<&str>;
    fn set_given_name<T: Into<String>>(&mut self, new: Option<T>);
}

/// Account has middle name field
pub trait HasMiddleName {
    fn get_middle_name(&self) -> Option<&str>;
    fn set_middle_name<T: Into<String>>(&mut self, new: Option<T>);
}

/// Account has family name field
pub trait HasFamilyName {
    fn get_family_name(&self) -> Option<&str>;
    fn set_family_name<T: Into<String>>(&mut self, new: Option<T>);
}

/// Account has gender field
pub trait HasGender {
    fn get_gender(&self) -> Option<Gender>;
    fn set_gender(&mut self, new: Option<Gender>);
}

/// Account has birth date field
pub trait HasBirthDate {
    fn get_birth_date(&self) -> Option<TimeStamp>;
    fn set_birth_date(&mut self, new: Option<TimeStamp>);
}

/// Account has create date field
pub trait HasCreateDate {
    fn get_create_date(&self) -> Option<TimeStamp>;
    fn set_create_date(&mut self, new: Option<TimeStamp>);
}

/// Account has about me field
pub trait HasAbout {
    fn get_about(&self) -> Option<&str>;
    fn set_about<T: Into<String>>(&mut self, new: Option<T>);
}

/// Account has time zone field
pub trait HasTimeZone {
    fn get_time_zone(&self) -> Option<TimeStamp>;
    fn set_time_zone(&mut self, new: Option<TimeStamp>);
}

/// Account has locale field
pub trait HasLocale {
    fn get_locale(&self) -> Option<&str>;
    fn set_locale<T: Into<String>>(&mut self, new: Option<T>);
}

/// Account has location field
pub trait HasLocation {
    fn get_location(&self) -> Option<&str>;
    fn set_location<T: Into<String>>(&mut self, new: Option<T>);
}

/// Account has company field
pub trait HasCompany {
    fn get_company(&self) -> Option<&str>;
    fn set_company<T: Into<String>>(&mut self, new: Option<T>);
}

/// Account has position field
pub trait HasPosition {
    fn get_position(&self) -> Option<&str>;
    fn set_position<T: Into<String>>(&mut self, new: Option<T>);
}

/// Account has email field
pub trait HasEmail {
    fn get_email(&self) -> Option<&MailAddress>;
    fn set_email(&mut self, new: Option<MailAddress>);
}

/// Account has avatar url field
pub trait HasImageUrl {
    fn get_image_url(&self) -> Option<&Url>;
    fn set_image_url(&mut self, new: Option<Url>);
}

/// Account has home page field
pub trait HasHomeUrl {
    fn get_home_url(&self) -> Option<&Url>;
    fn set_home_url(&mut self, new: Option<Url>);
}
