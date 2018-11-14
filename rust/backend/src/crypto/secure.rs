use super::{CanDecrypt, CanEncrypt, CanKeygen, CryptoError, SecureKey};
use bytes::{BufMut, Bytes, BytesMut};
use sodiumoxide::crypto::secretbox::{
    gen_key, gen_nonce, open_detached, seal_detached, Nonce, Tag, MACBYTES, NONCEBYTES,
};

impl CanKeygen for SecureKey {
    fn gen_key() -> Self {
        gen_key()
    }
}

impl CanEncrypt for SecureKey {
    fn seal_raw<B>(&self, msg: B) -> Bytes
    where
        B: AsRef<[u8]>,
    {
        let msg = msg.as_ref();

        let mut body = BytesMut::with_capacity(NONCEBYTES + MACBYTES + msg.len());
        let mut head = body.split_to(NONCEBYTES + MACBYTES);

        let nonce = gen_nonce();
        head.put_slice(nonce.as_ref());

        body.put_slice(msg);

        let tag = seal_detached(&mut body[..], &nonce, &self);
        head.put_slice(tag.as_ref());

        head.unsplit(body);
        head.freeze()
    }
}

impl CanDecrypt for SecureKey {
    fn open_raw<B>(&self, msg: B) -> Result<Bytes, CryptoError>
    where
        B: AsRef<[u8]>,
    {
        let msg = msg.as_ref();

        if msg.len() < NONCEBYTES + MACBYTES {
            return Err(CryptoError::BadCrypto);
        }

        let nonce = Nonce::from_slice(&msg[0..NONCEBYTES]).ok_or(CryptoError::BadCrypto)?;
        let msg = &msg[NONCEBYTES..];

        let tag = Tag::from_slice(&msg[0..MACBYTES]).ok_or(CryptoError::BadCrypto)?;
        let msg = &msg[MACBYTES..];

        let mut buf = BytesMut::with_capacity(msg.len());
        buf.put_slice(msg);

        if open_detached(&mut buf[..], &tag, &nonce, &self).is_ok() {
            Ok(buf.freeze())
        } else {
            Err(CryptoError::BadCrypto)
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn secure_text_raw() {
        let key = SecureKey::gen_key();

        let source = "Hello world!";

        let sealed = key.seal_text_raw(&source);
        let opened: String = key.open_text_raw(&sealed).unwrap();

        assert_eq!(&opened, &source);
    }

    #[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
    struct JsonData {
        id: u32,
        name: String,
    }

    #[test]
    fn secure_json_b64() {
        let key = SecureKey::gen_key();

        let source = JsonData {
            id: 11,
            name: "Michael".into(),
        };

        let sealed = key.seal_json_b64(&source).unwrap();
        let opened: JsonData = key.open_json_b64(&sealed).unwrap();

        assert_eq!(&opened, &source);
    }
}
