/**

## Generate [`access::IsUserRole`] implementation

```ignore
role_perm! {
    RoleEnum -> PermEnum:
    SomeRole => SomePerm OtherPerm,
    OtherRole => ...,
    ...
}
```

*/
#[macro_export]
macro_rules! role_perm {
    ($role_enum:ident -> $perm_enum:ident : $($role:ident => $($perm:ident)*),+ $(,)*) => {
        impl $crate::access::HasPerm<$perm_enum> for $role_enum {
            fn has_perm(&self, perm: $perm_enum) -> bool {
                match self {
                    $($role_enum::$role => match perm {
                        $($perm_enum::$perm)|+ => true,
                        _ => false,
                    }),+
                }
            }
        }

        impl $crate::access::IsUserRole for $role_enum {
            type Perm = $perm_enum;
        }
    };
}
