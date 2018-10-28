use bytes::Buf;
use crypto::{decrypt_base64_sealed_json, DecryptError, HasPublicKey, HasSecretKey};
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
pub fn base64_sealed_json<T, K>(keys: K) -> impl Filter<Extract = (T,), Error = Rejection> + Clone
where
    T: DeserializeOwned + Send,
    K: HasPublicKey + HasSecretKey + Send + Clone,
{
    let keys = any().map(move || keys.clone());

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
                Err(custom(DecryptError::Mime))
            }
        }).and(concat())
        .and(keys)
        .and_then(|_, body: FullBody, keys| decrypt_base64_sealed_json(body.bytes(), keys))
}

#[cfg(test)]
mod test {
    use super::*;
    use crypto::gen_keys;

    #[test]
    fn test() {
        let keys = gen_keys();
        let _h = any().and(base64_sealed_json::<u32, _>(keys));
    }
}
