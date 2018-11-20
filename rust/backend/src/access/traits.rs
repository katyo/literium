use super::AccessError;
use std::collections::HashSet;
use std::fmt::Debug;
use std::hash::Hash;
use warp::{reject::custom, Rejection};

/** Check access to object

The example of access grants:

```
use literium::{
    access::HasAccess,
    user::UserId,
};
use std::collections::HashSet;

#[derive(PartialEq, Eq, Hash)]
pub enum Role {
    Blogger,
    Admin,
}

pub struct User {
    id: UserId,
    roles: HashSet<Role>,
}

pub enum Grant {
    Read,
    Create,
    Update,
    Delete,
}

pub struct Post {
    id: u32,
    author: UserId,
    public: bool,
}

impl HasAccess<Post, Grant> for User {
    fn has_access(&self, grant: &Grant) -> bool {
        match grant {
            Grant::Create =>
                // Only bloger can create new posts
                self.roles.contains(&Role::Blogger),
            _ => false,
        }
    }

    fn has_access_to(&self, post: &Post, grant: &Grant) -> bool {
        match grant {
            Grant::Read =>
                // Everyone can read published posts
                post.public ||
                // Administer can read any posts
                self.roles.contains(&Role::Admin) ||
                // Author can read own posts
                self.roles.contains(&Role::Blogger) &&
                    post.author == self.id,
            Grant::Update =>
                // Administer can edit any posts
                self.roles.contains(&Role::Admin) ||
                // Author can edit own posts
                self.roles.contains(&Role::Blogger) &&
                    post.author == self.id,
            Grant::Delete =>
                // Only administer can delete posts
                self.roles.contains(&Role::Admin),
            _ => false,
        }
    }
}

fn main() {
    let guest = User { id: 0, roles: HashSet::new() };
    let blogger = User { id: 11, roles: std::iter::once(Role::Blogger).collect() };
    let admin = User { id: 1, roles: std::iter::once(Role::Admin).collect() };

    let post1 = Post { id: 1, author: 10, public: true };
    let post2 = Post { id: 2, author: 11, public: true };
    let post3 = Post { id: 3, author: 11, public: false };
    let post4 = Post { id: 4, author: 10, public: false };

    // Everyone can read any published posts
    assert_eq!(guest.has_access_to(&post2, &Grant::Read), true);
    assert_eq!(blogger.has_access_to(&post1, &Grant::Read), true);
    assert_eq!(admin.has_access_to(&post1, &Grant::Read), true);

    // Author can read own unpublished post
    assert_eq!(blogger.has_access_to(&post3, &Grant::Read), true);
    // But can't read others
    assert_eq!(blogger.has_access_to(&post4, &Grant::Read), false);
    // But administer can
    assert_eq!(admin.has_access_to(&post4, &Grant::Read), true);

    // Only blogger can write new posts
    assert_eq!(blogger.has_access(&Grant::Create), true);
    // Others can't
    assert_eq!(guest.has_access(&Grant::Create), false);
    assert_eq!(admin.has_access(&Grant::Create), false);

    // Guest can't edit posts
    assert_eq!(guest.has_access_to(&post1, &Grant::Update), false);
    assert_eq!(guest.has_access_to(&post2, &Grant::Update), false);
    assert_eq!(guest.has_access_to(&post3, &Grant::Update), false);
    assert_eq!(guest.has_access_to(&post4, &Grant::Update), false);

    // Author can edit own posts
    assert_eq!(blogger.has_access_to(&post2, &Grant::Update), true);
    assert_eq!(blogger.has_access_to(&post3, &Grant::Update), true);
    // But cannot edit others
    assert_eq!(blogger.has_access_to(&post1, &Grant::Update), false);
    assert_eq!(blogger.has_access_to(&post4, &Grant::Update), false);

    // Administer can edit any posts
    assert_eq!(admin.has_access_to(&post1, &Grant::Update), true);
    assert_eq!(admin.has_access_to(&post2, &Grant::Update), true);
    assert_eq!(admin.has_access_to(&post3, &Grant::Update), true);
    assert_eq!(admin.has_access_to(&post4, &Grant::Update), true);

    // Even author cannot delete own posts
    assert_eq!(blogger.has_access_to(&post2, &Grant::Delete), false);
    assert_eq!(blogger.has_access_to(&post3, &Grant::Delete), false);
    // But administer can
    assert_eq!(admin.has_access_to(&post2, &Grant::Delete), true);
    assert_eq!(admin.has_access_to(&post3, &Grant::Delete), true);
}

```

*/
pub trait HasAccess<Object, Grant>
where
    Self: Sized,
{
    fn has_access(&self, _grant: &Grant) -> bool {
        false
    }

    fn has_access_to(&self, _object: &Object, _grant: &Grant) -> bool {
        false
    }

    fn access(self, grant: &Grant) -> Result<Self, Rejection>
    where
        Grant: Debug,
    {
        if self.has_access(grant) {
            Ok(self)
        } else {
            warn!("Denied access with: {:?}", grant);
            Err(custom(AccessError::Denied))
        }
    }

    fn access_to(self, object: &Object, grant: &Grant) -> Result<Self, Rejection>
    where
        Object: Debug,
        Grant: Debug,
    {
        if self.has_access(grant) {
            Ok(self)
        } else {
            warn!("Denied access to {:?} with: {:?}", object, grant);
            Err(custom(AccessError::Denied))
        }
    }
}

/** Something has specific permission

```
use literium::{
    access::{HasPerm},
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum AuthPerm {
    Authorize,
    ViewOwnSessions,
    ViewAnySessions,
    DropOwnSessions,
    DropAnySessions,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum UserPerm {
    ViewOwnUser,
    ViewAnyUser,
    EditOwnUser,
    EditAnyUser,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum Perm {
    Auth(AuthPerm),
    User(UserPerm),
    Other,
}

impl HasPerm<Perm> for Perm {
    fn has_perm(&self, perm: Perm) -> bool {
        *self == perm
    }
}

impl HasPerm<AuthPerm> for Perm {
    fn has_perm(&self, perm: AuthPerm) -> bool {
        *self == Perm::Auth(perm)
    }
}

fn main() {
    let perms = vec![Perm::Auth(AuthPerm::Authorize), Perm::User(UserPerm::ViewOwnUser)];
    assert_eq!(perms.has_perm(AuthPerm::Authorize), true);
    assert_eq!(perms.has_perm(Perm::Auth(AuthPerm::Authorize)), true);
    assert_eq!(perms.has_perm(AuthPerm::ViewAnySessions), false);
    assert_eq!(perms.has_perm(Perm::User(UserPerm::ViewOwnUser)), true);
    assert_eq!(perms.has_perm(Perm::User(UserPerm::EditOwnUser)), false);
    assert_eq!(perms.has_perm(Perm::Other), false);
}
```
 */
pub trait HasPerm<Perm> {
    /// Check specific permission
    fn has_perm(&self, perm: Perm) -> bool;
}

pub trait HasPerms
where
    Self: AsRef<<Self as HasPerms>::Grant>,
{
    /// Something what implements `HasPerm` traits
    ///
    /// This can be as permission(s) type itself so as role(s) type.
    type Grant;

    /// Check specific permission
    fn has_perm<P>(&self, perm: P) -> bool
    where
        <Self as HasPerms>::Grant: HasPerm<P>,
    {
        self.as_ref().has_perm(perm)
    }
}

/// Trait for user roles
///
/// You should implement this trait for user roles to setting up role-based access control.
///
pub trait IsUserRole
where
    Self: HasPerm<<Self as IsUserRole>::Perm>,
{
    type Perm;
}

impl<T, P> HasPerm<P> for Vec<T>
where
    T: HasPerm<P>,
    P: Copy,
{
    fn has_perm(&self, perm: P) -> bool {
        self.iter().any(|val| val.has_perm(perm))
    }
}

impl<T, P> HasPerm<P> for HashSet<T>
where
    T: HasPerm<P> + Eq + Hash,
    P: Copy,
{
    fn has_perm(&self, perm: P) -> bool {
        self.iter().any(|val| val.has_perm(perm))
    }
}

/// Trait for access control subject
pub trait HasUserRoles {
    type Role: IsUserRole;
    type Roles: HasPerm<<Self::Role as IsUserRole>::Perm>;

    fn get_roles(&self) -> &Self::Roles;

    fn has_perm(&self, perm: <Self::Role as IsUserRole>::Perm) -> bool {
        self.get_roles().has_perm(perm)
    }
}

/*
impl<P, R> HasPerm<R>
where
    R: HasUserRoles,
    R::Role: HasPerm<<Self::Role as IsUserRole>::Perm>,
{
    fn has_perm(&self, perm: <Self::Role as IsUserRole>::Perm) -> bool {
        self.get_roles().has_perm(perm)
    }
}
*/
