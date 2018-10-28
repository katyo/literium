use std::collections::HashSet;
use std::hash::Hash;

/// Trait for user roles
///
/// You should implement this trait for user roles to setting up role-based access control.
///
pub trait IsUserRole {
    type Perm;

    /// Check then speific role has specific permission
    fn has_perm(&self, perm: Self::Perm) -> bool;
}

/// Trait for collections of user roles
pub trait IsUserRoles<Role, Perm> {
    fn has_perm(&self, perm: Perm) -> bool;
}

impl<Role, Perm> IsUserRoles<Role, Perm> for Vec<Role>
where
    Role: IsUserRole<Perm = Perm>,
    Perm: Copy,
{
    fn has_perm(&self, perm: Perm) -> bool {
        self.iter().any(|role| role.has_perm(perm))
    }
}

impl<Role, Perm> IsUserRoles<Role, Perm> for HashSet<Role>
where
    Role: Eq + Hash + IsUserRole<Perm = Perm>,
    Perm: Copy,
{
    fn has_perm(&self, perm: Perm) -> bool {
        self.iter().any(|role| role.has_perm(perm))
    }
}

/// Trait for access control subject
pub trait HasUserRoles {
    type Role: IsUserRole;
    type Roles: IsUserRoles<Self::Role, <Self::Role as IsUserRole>::Perm>;

    fn get_roles(&self) -> &Self::Roles;

    fn has_perm(&self, perm: <Self::Role as IsUserRole>::Perm) -> bool {
        self.get_roles().has_perm(perm)
    }
}
