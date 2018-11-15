/*!

## Role-based access control

In order to simplify access control in applications the role-based permissions management is used.

It means that:

* Each user has one or several number of roles
* Each role has some permissions
* Each permission controls access to some resource in some way
* By default user has no any permissions
* User has some permission when it has a role which has this permission

Usage example:

```
#[macro_use]
extern crate literium;

use literium::access::{IsUserRole, HasUserRoles};

#[derive(Clone, Copy)]
enum UserPerm {
    View,
    Edit,
    Publish,
}

#[derive(Clone, Copy)]
enum UserRole {
    Guest,
    Editor,
    Director,
}

role_perm! {
    UserRole -> UserPerm :
    Guest => View,
    Editor => View Edit,
    Director => View Publish,
}

struct User {
    roles: Vec<UserRole>,
}

impl HasUserRoles for User {
    type Role = UserRole;
    type Roles = Vec<Self::Role>;

    fn get_roles(&self) -> &Self::Roles {
        &self.roles
    }
}

fn main() {
    let guest = User {
        roles: vec![UserRole::Guest],
    };

    assert_eq!(guest.has_perm(UserPerm::View), true);
    assert_eq!(guest.has_perm(UserPerm::Edit), false);
    assert_eq!(guest.has_perm(UserPerm::Publish), false);

    let editor = User {
        roles: vec![UserRole::Editor],
    };

    assert_eq!(editor.has_perm(UserPerm::View), true);
    assert_eq!(editor.has_perm(UserPerm::Edit), true);
    assert_eq!(editor.has_perm(UserPerm::Publish), false);

    let admin = User {
        roles: vec![UserRole::Editor, UserRole::Director],
    };

    assert_eq!(admin.has_perm(UserPerm::View), true);
    assert_eq!(admin.has_perm(UserPerm::Edit), true);
    assert_eq!(admin.has_perm(UserPerm::Publish), true);
}
```

In example above macro [`role_perm`] generates next code:

```ignore
impl IsUserRole for UserRole {
    type Perm = UserPerm;

    fn has_perm(&self, perm: Self::Perm) -> bool {
        use self::UserPerm::*;
        use self::UserRole::*;
        match self {
            Guest => match perm {
                View => true,
                _ => false,
            },
            Editor => match perm {
                View | Edit => true,
                _ => false,
            },
            Director => match perm {
                View | Publish => true,
                _ => false,
            },
        }
    }
}
```

 */

mod traits;
#[macro_use]
mod macros;

pub use self::traits::{HasUserRoles, IsUserRole, IsUserRoles};

#[cfg(test)]
mod test {
    use super::*;

    #[derive(Clone, Copy)]
    enum UserPerm {
        View,
        Edit,
        Publish,
    }

    #[derive(Clone, Copy)]
    enum UserRole {
        Guest,
        Editor,
        Director,
    }

    role_perm! {
        UserRole -> UserPerm :
        Guest => View,
        Editor => View Edit,
        Director => View Publish,
    }

    struct User {
        roles: Vec<UserRole>,
    }

    impl HasUserRoles for User {
        type Role = UserRole;
        type Roles = Vec<Self::Role>;

        fn get_roles(&self) -> &Self::Roles {
            &self.roles
        }
    }

    #[test]
    fn has_perm() {
        let guest = User {
            roles: vec![UserRole::Guest],
        };

        assert_eq!(guest.has_perm(UserPerm::View), true);
        assert_eq!(guest.has_perm(UserPerm::Edit), false);
        assert_eq!(guest.has_perm(UserPerm::Publish), false);

        let editor = User {
            roles: vec![UserRole::Editor],
        };

        assert_eq!(editor.has_perm(UserPerm::View), true);
        assert_eq!(editor.has_perm(UserPerm::Edit), true);
        assert_eq!(editor.has_perm(UserPerm::Publish), false);

        let admin = User {
            roles: vec![UserRole::Editor, UserRole::Director],
        };

        assert_eq!(admin.has_perm(UserPerm::View), true);
        assert_eq!(admin.has_perm(UserPerm::Edit), true);
        assert_eq!(admin.has_perm(UserPerm::Publish), true);
    }
}
