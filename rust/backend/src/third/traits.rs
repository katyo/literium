use super::ThirdError;
use base::BoxFuture;
use std::borrow::Cow;

/// Third service interface
pub trait IsThirdService<S, A>: Sized {
    /// The name of provider
    ///
    /// Example: guthub, google, ...etc.
    fn service_name(&self) -> Cow<str>;

    /// Fetch user info
    ///
    /// Get user profile from third service
    fn get_user_profile(&self, state: &S, access_token: Cow<str>) -> BoxFuture<A, ThirdError>;
}

impl<'a, T, S, A> IsThirdService<S, A> for &'a T
where
    T: IsThirdService<S, A>,
{
    fn service_name(&self) -> Cow<str> {
        (*self).service_name()
    }

    fn get_user_profile(&self, state: &S, access_token: Cow<str>) -> BoxFuture<A, ThirdError> {
        (*self).get_user_profile(state, access_token)
    }
}
