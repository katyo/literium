use bytes::Buf;
use crypto::{CanDecrypt, CryptoError, HasSecretKey};
use mime::Mime;
use serde::de::DeserializeOwned;
use warp::{
    any,
    body::{concat, FullBody},
    header,
    reject::custom,
    Filter, Rejection,
};

const MIME_SUBTYPE: &str = "x-base64-sealed-json";

/// Decrypt base64 encoded sealed JSON body
///
/// `Content-Type` header should ends with "x-base64-sealed-json".
///
/// For example `Content-Type: application/x-base64-sealed-json`.
pub fn base64_sealed_json<T, S>(state: S) -> impl Filter<Extract = (T,), Error = Rejection> + Clone
where
    T: DeserializeOwned + Send,
    S: HasSecretKey + Send + Clone,
    //S::KeyData: AsRef<PublicKey> + AsRef<SecretKey>,
{
    let state = any().map(move || state.clone());

    any()
        .and(header("content-type"))
        .and_then(|mime: Mime| {
            if mime.subtype() == MIME_SUBTYPE || mime
                .suffix()
                .map(|sfx| sfx == MIME_SUBTYPE)
                .unwrap_or(false)
            {
                Ok(())
            } else {
                Err(custom(CryptoError::BadMime))
            }
        }).and(concat())
        .and(state)
        .and_then(|_, body: FullBody, state: S| {
            (state.as_ref() as &S::SecretKey)
                .open_json_b64(body.bytes())
                .map_err(custom)
        })
}

#[cfg(test)]
mod test {
    use super::*;
    use crypto::{CanKeygen, CryptoKeys};

    #[test]
    fn test() {
        let keys = CryptoKeys::gen_key();
        let _h = any().and(base64_sealed_json::<u32, _>(keys));
    }
}
