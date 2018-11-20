/*!

## Dummy users backend implementation

This module provides dummy implementation of user data storage backend for examples and tests.

*/

use super::{
    create_password, AccountId, Gender, HasAbout, HasBirthDate, HasCompany, HasCreateDate,
    HasEmail, HasFamilyName, HasFullName, HasGender, HasGivenName, HasHomeUrl, HasImageUrl,
    HasLocale, HasLocation, HasMiddleName, HasNickName, HasPasswordHash, HasPosition, HasTimeZone,
    IsAccountAccess, IsAccountData, IsUserAccess, IsUserData, UserArg, UserId,
};
use access::{Grant, HasAccess};
use auth::{otpass::EmailUserIdent, SessionArg};
use base::{
    dummy::DummyError, BoxFuture, CanCreateView, CanUpdateData, CanUpdateFrom, IsBackend, TimeStamp,
};
use futures::future::result;
use mail::MailAddress;
use std::borrow::Cow;
use std::ops::Deref;
use std::sync::{Arc, RwLock};
use url::Url;
use url_serde::Serde;

/// User data type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserData {
    /// Unique identifier of user
    pub id: UserId,

    /// User name
    pub name: String,

    /// Email address
    pub email: Option<MailAddress>,

    /// Password hash
    pub hash: Option<Vec<u8>>,
}

impl UserData {
    /// Create new user
    pub fn new<S: Into<String>>(id: UserId, name: S) -> Self {
        Self {
            id,
            name: name.into(),
            email: None,
            hash: None,
        }
    }

    /// Set user password
    pub fn with_password<S: AsRef<str>>(mut self, new: S) -> Self {
        self.hash = Some(create_password(new));
        self
    }
}

impl IsUserData for UserData {
    fn get_user_id(&self) -> UserId {
        self.id
    }

    fn get_user_name(&self) -> &str {
        &self.name
    }

    fn set_user_name<S: Into<String>>(&mut self, name: S) {
        self.name = name.into();
    }

    fn create_new<S: Into<String>>(name: S) -> Self {
        UserData::new(0, name.into())
    }
}

impl HasPasswordHash for UserData {
    fn get_password_hash(&self) -> Option<&[u8]> {
        self.hash.as_ref().map(AsRef::as_ref)
    }

    fn set_password_hash<S: AsRef<[u8]>>(&mut self, new: Option<S>) {
        self.hash = new.map(|s| Vec::from(s.as_ref()));
    }
}

impl CanUpdateFrom<EmailUserIdent> for UserData {
    fn update_from(&mut self, ident: &EmailUserIdent) {
        self.email = Some(ident.email.clone());
    }
}

/// User info type
#[derive(Serialize, Deserialize)]
pub struct UserInfo {
    pub id: Option<UserId>,
    pub name: Option<String>,
    pub email: Option<MailAddress>,
    pub pass: Option<String>,
}

impl<A> CanCreateView<A, SessionArg> for UserData
where
    A: HasAccess<SessionArg, Grant>,
{
    type View = UserInfo;

    fn create_view(&self, _auth: &A) -> Self::View {
        UserInfo {
            id: None,
            name: Some(self.name.clone()),
            email: None,
            pass: None,
        }
    }
}

impl<A> CanCreateView<A, UserArg> for UserData
where
    A: HasAccess<UserArg, Grant>,
{
    type View = UserInfo;

    fn create_view(&self, auth: &A) -> Self::View {
        let manage = auth.has_access_to(&UserArg { user: self.id }, &Grant::Manage);

        UserInfo {
            id: Some(self.id),
            name: Some(self.name.clone()),
            email: if manage { self.email.clone() } else { None },
            pass: None,
        }
    }
}

impl<A> CanUpdateData<A, UserArg> for UserData
where
    A: HasAccess<UserArg, Grant>,
{
    type View = UserInfo;

    fn update_data(&mut self, auth: &A, view: &Self::View) {
        let manage = auth.has_access_to(&UserArg { user: self.id }, &Grant::Manage);

        if manage {
            if let Some(name) = &view.name {
                self.name = name.clone();
            }
        }

        if let Some(email) = &view.email {
            self.email = Some(email.clone());
        }

        if let Some(pass) = &view.pass {
            self.hash = Some(create_password(pass));
        }
    }
}

/// Dummy users backend
#[derive(Clone)]
pub struct Users {
    users: Arc<RwLock<Vec<UserData>>>,
}

impl IsBackend for Users {
    type Error = DummyError;
}

impl Users {
    /// Create users backend
    pub fn new() -> Self {
        Self {
            users: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Add user
    pub fn with_user(self, user: UserData) -> Self {
        self.users.write().unwrap().push(user);
        self
    }
}

impl IsUserAccess for Users {
    type User = UserData;

    fn find_user_data<'a, S: Into<Cow<'a, str>>>(
        &self,
        name: S,
    ) -> BoxFuture<Option<Self::User>, Self::Error> {
        let name = name.into();
        Box::new(result(
            self.users
                .read()
                .map(|users| {
                    users
                        .iter()
                        .find(|data| data.name == name)
                        .map(Clone::clone)
                }).map_err(|_| DummyError),
        ))
    }

    fn get_user_data(&self, user: UserId) -> BoxFuture<Option<Self::User>, Self::Error> {
        Box::new(result(
            self.users
                .read()
                .map(|users| users.iter().find(|data| data.id == user).map(Clone::clone))
                .map_err(|_| DummyError),
        ))
    }

    fn put_user_data(&self, mut user: Self::User) -> BoxFuture<Self::User, Self::Error> {
        Box::new(result(
            self.users
                .write()
                .map(|mut users| {
                    if let Some(index) = users.iter().position(|data| data.id == user.id) {
                        users[index] = user.clone();
                    } else {
                        user.id = users.len() as u32 + 1;
                        users.push(user.clone());
                    }
                    user
                }).map_err(|_| DummyError),
        ))
    }
}

/// User personality information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountData {
    pub id: AccountId,
    pub user: UserId,
    pub name: String,
    pub service: String,
    pub nick_name: Option<String>,
    pub full_name: Option<String>,
    pub given_name: Option<String>,
    pub middle_name: Option<String>,
    pub family_name: Option<String>,
    pub gender: Option<Gender>,
    pub birth_date: Option<TimeStamp>,
    pub locale: Option<String>,
    pub time_zone: Option<TimeStamp>,
    pub location: Option<String>,
    pub company: Option<String>,
    pub position: Option<String>,
    pub create_date: Option<TimeStamp>,
    pub email: Option<MailAddress>,
    pub home_url: Option<Serde<Url>>,
    pub image_url: Option<Serde<Url>>,
    pub about: Option<String>,
}

impl CanUpdateFrom<AccountData> for UserData {
    fn update_from(&mut self, account: &AccountData) {
        self.email = account.get_email().map(Clone::clone);
    }
}

impl IsAccountData for AccountData {
    fn get_account_id(&self) -> AccountId {
        self.id
    }

    fn set_account_id(&mut self, new: AccountId) {
        self.id = new;
    }

    fn get_account_name(&self) -> &str {
        &self.name
    }

    fn set_account_name<S: Into<String>>(&mut self, name: S) {
        self.name = name.into();
    }

    fn get_account_service(&self) -> &str {
        &self.service
    }

    fn set_account_service<S: Into<String>>(&mut self, name: S) {
        self.service = name.into();
    }

    fn get_user_id(&self) -> UserId {
        self.user
    }

    fn set_user_id(&mut self, new: UserId) {
        self.user = new;
    }

    fn create_new<S: Into<String>>(name: S) -> Self {
        AccountData {
            id: 0,
            user: 0,
            name: name.into(),
            service: String::default(),
            nick_name: None,
            full_name: None,
            given_name: None,
            middle_name: None,
            family_name: None,
            gender: None,
            create_date: None,
            birth_date: None,
            locale: None,
            company: None,
            position: None,
            time_zone: None,
            location: None,
            email: None,
            home_url: None,
            image_url: None,
            about: None,
        }
    }
}

impl HasNickName for AccountData {
    fn get_nick_name(&self) -> Option<&str> {
        self.nick_name.as_ref().map(AsRef::as_ref)
    }

    fn set_nick_name<T: Into<String>>(&mut self, new: Option<T>) {
        self.nick_name = new.map(Into::into);
    }
}

impl HasFullName for AccountData {
    fn get_full_name(&self) -> Option<&str> {
        self.full_name.as_ref().map(AsRef::as_ref)
    }

    fn set_full_name<T: Into<String>>(&mut self, new: Option<T>) {
        self.full_name = new.map(Into::into);
    }
}

impl HasGivenName for AccountData {
    fn get_given_name(&self) -> Option<&str> {
        self.given_name.as_ref().map(AsRef::as_ref)
    }

    fn set_given_name<T: Into<String>>(&mut self, new: Option<T>) {
        self.given_name = new.map(Into::into);
    }
}

impl HasMiddleName for AccountData {
    fn get_middle_name(&self) -> Option<&str> {
        self.middle_name.as_ref().map(AsRef::as_ref)
    }

    fn set_middle_name<T: Into<String>>(&mut self, new: Option<T>) {
        self.middle_name = new.map(Into::into);
    }
}

impl HasFamilyName for AccountData {
    fn get_family_name(&self) -> Option<&str> {
        self.family_name.as_ref().map(AsRef::as_ref)
    }

    fn set_family_name<T: Into<String>>(&mut self, new: Option<T>) {
        self.family_name = new.map(Into::into);
    }
}

impl HasGender for AccountData {
    fn get_gender(&self) -> Option<Gender> {
        self.gender
    }

    fn set_gender(&mut self, new: Option<Gender>) {
        self.gender = new;
    }
}

impl HasBirthDate for AccountData {
    fn get_birth_date(&self) -> Option<TimeStamp> {
        self.birth_date
    }

    fn set_birth_date(&mut self, new: Option<TimeStamp>) {
        self.birth_date = new;
    }
}

impl HasCreateDate for AccountData {
    fn get_create_date(&self) -> Option<TimeStamp> {
        self.create_date
    }

    fn set_create_date(&mut self, new: Option<TimeStamp>) {
        self.create_date = new;
    }
}

impl HasAbout for AccountData {
    fn get_about(&self) -> Option<&str> {
        self.about.as_ref().map(AsRef::as_ref)
    }

    fn set_about<T: Into<String>>(&mut self, new: Option<T>) {
        self.about = new.map(Into::into)
    }
}

impl HasTimeZone for AccountData {
    fn get_time_zone(&self) -> Option<TimeStamp> {
        self.time_zone
    }

    fn set_time_zone(&mut self, new: Option<TimeStamp>) {
        self.time_zone = new;
    }
}

impl HasLocale for AccountData {
    fn get_locale(&self) -> Option<&str> {
        self.locale.as_ref().map(AsRef::as_ref)
    }

    fn set_locale<T: Into<String>>(&mut self, new: Option<T>) {
        self.locale = new.map(Into::into);
    }
}

impl HasLocation for AccountData {
    fn get_location(&self) -> Option<&str> {
        self.location.as_ref().map(AsRef::as_ref)
    }

    fn set_location<T: Into<String>>(&mut self, new: Option<T>) {
        self.location = new.map(Into::into);
    }
}

impl HasCompany for AccountData {
    fn get_company(&self) -> Option<&str> {
        self.company.as_ref().map(AsRef::as_ref)
    }

    fn set_company<T: Into<String>>(&mut self, new: Option<T>) {
        self.company = new.map(Into::into);
    }
}

impl HasPosition for AccountData {
    fn get_position(&self) -> Option<&str> {
        self.position.as_ref().map(AsRef::as_ref)
    }

    fn set_position<T: Into<String>>(&mut self, new: Option<T>) {
        self.position = new.map(Into::into);
    }
}

impl HasEmail for AccountData {
    fn get_email(&self) -> Option<&MailAddress> {
        self.email.as_ref()
    }

    fn set_email(&mut self, new: Option<MailAddress>) {
        self.email = new;
    }
}

impl HasImageUrl for AccountData {
    fn get_image_url(&self) -> Option<&Url> {
        self.image_url.as_ref().map(Deref::deref)
    }

    fn set_image_url(&mut self, new: Option<Url>) {
        self.image_url = new.map(Serde);
    }
}

impl HasHomeUrl for AccountData {
    fn get_home_url(&self) -> Option<&Url> {
        self.home_url.as_ref().map(Deref::deref)
    }

    fn set_home_url(&mut self, new: Option<Url>) {
        self.home_url = new.map(Serde);
    }
}

/// Dummy accounts backend
#[derive(Clone)]
pub struct Accounts {
    accounts: Arc<RwLock<Vec<AccountData>>>,
}

impl IsBackend for Accounts {
    type Error = DummyError;
}

impl Accounts {
    /// Create accounts backend
    pub fn new() -> Self {
        Self {
            accounts: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Add account
    pub fn with_account(self, account: AccountData) -> Self {
        self.accounts.write().unwrap().push(account);
        self
    }
}

impl IsAccountAccess for Accounts {
    /// Account data type
    type Account = AccountData;

    /// Find account of user
    fn find_user_account<'a, S: Into<Cow<'a, str>>, N: Into<Cow<'a, str>>>(
        &self,
        service: S,
        account: N,
    ) -> BoxFuture<Option<Self::Account>, Self::Error> {
        let service = service.into();
        let name = account.into();
        Box::new(result(
            self.accounts
                .read()
                .map(|accounts| {
                    accounts
                        .iter()
                        .find(|data| data.service == service && data.name == name)
                        .map(Clone::clone)
                }).map_err(|_| DummyError),
        ))
    }

    /// Get account of user
    fn get_user_account(
        &self,
        account: AccountId,
    ) -> BoxFuture<Option<Self::Account>, Self::Error> {
        Box::new(result(
            self.accounts
                .read()
                .map(|accounts| {
                    accounts
                        .iter()
                        .find(|data| data.id == account)
                        .map(Clone::clone)
                }).map_err(|_| DummyError),
        ))
    }

    /// Save user account
    fn put_user_account(
        &self,
        mut account: Self::Account,
    ) -> BoxFuture<Self::Account, Self::Error> {
        Box::new(result(
            self.accounts
                .write()
                .map(|mut accounts| {
                    if let Some(index) = accounts.iter().position(|data| data.id == account.id) {
                        accounts[index] = account.clone();
                    } else {
                        account.id = accounts.len() as u32 + 1;
                        accounts.push(account.clone());
                    }
                    account
                }).map_err(|_| DummyError),
        ))
    }
}
