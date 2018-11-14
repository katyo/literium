/*!

## HTTP(S) requests cinstruction kit

 */
use std::error::Error;
use std::fmt::{Display, Formatter, Result as FmtResult};
use std::ops::Deref;

/// Set method to request
pub struct Method<M, B>(pub M, pub B);

/// Set url to request
pub struct Url<U, B>(pub U, pub B);

/// Set url with query params to request
pub struct UrlWithQuery<U, P, B>(pub U, pub P, pub B);

/// Add header to request
pub struct Header<K, V, B>(pub K, pub V, pub B);

/// Error placeholder
#[derive(Debug)]
pub struct NoError;

impl Error for NoError {}

impl Display for NoError {
    fn fmt(&self, _f: &mut Formatter) -> FmtResult {
        Ok(())
    }
}

/// No body (or empty) for responses and requests
pub struct NoBody;

/// Raw concatenated body for responses and requests
pub struct RawBody<T>(pub T);

impl<T> RawBody<T> {
    /// Unwrap inner data
    pub fn into_inner(self) -> T {
        self.0
    }
}

impl<T> Deref for RawBody<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

/// Json body for responses and requests
pub struct JsonBody<T>(pub T);

impl<T> JsonBody<T> {
    /// Unwrap inner data
    pub fn into_inner(self) -> T {
        self.0
    }
}

impl<T> Deref for JsonBody<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

/// Url-encoded body for responses and requests
pub struct UrlEncodedBody<T>(pub T);

impl<T> UrlEncodedBody<T> {
    /// Unwrap inner data
    pub fn into_inner(self) -> T {
        self.0
    }
}

impl<T> Deref for UrlEncodedBody<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
