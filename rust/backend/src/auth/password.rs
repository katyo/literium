use crypto::random_bytes;
use sodiumoxide::crypto::pwhash::{
    pwhash, pwhash_verify, HashedPassword, MEMLIMIT_INTERACTIVE, OPSLIMIT_INTERACTIVE,
};
use std::ops::RangeInclusive;

/// Hash password utily
pub fn create_password<S: AsRef<str>>(password: S) -> Vec<u8> {
    (&(pwhash(
        password.as_ref().as_bytes(),
        OPSLIMIT_INTERACTIVE,
        MEMLIMIT_INTERACTIVE,
    ).unwrap()[..]))
        .into()
}

/// Check password utily
pub fn verify_password<S: AsRef<str>, H: AsRef<[u8]>>(password: S, hash: H) -> bool {
    if let Some(hashed) = HashedPassword::from_slice(hash.as_ref()) {
        pwhash_verify(&hashed, &password.as_ref().as_bytes())
    } else {
        false
    }
}

/// Arabic numbers
pub const ARABIC_NUMBER: RangeInclusive<char> = '0'..='9';

/// Latin lower case letters
pub const LATIN_LOWER_LETTER: RangeInclusive<char> = 'a'..='z';

/// Latin upper case letters
pub const LATIN_UPPER_LETTER: RangeInclusive<char> = 'A'..='Z';

/// Dictionary which contains only arabic numbers
pub const ARABIC_NUMBERS: [RangeInclusive<char>; 1] = [ARABIC_NUMBER];

/// Dictionary which contains only latin lower letters
pub const LATIN_LOWER_LETTERS: [RangeInclusive<char>; 1] = [LATIN_LOWER_LETTER];

/// Dictionary which contains only latin upper letters
pub const LATIN_UPPER_LETTERS: [RangeInclusive<char>; 1] = [LATIN_UPPER_LETTER];

/// Dictionary which contains only latin lower and upper letters
pub const LATIN_LETTERS: [RangeInclusive<char>; 2] = [LATIN_LOWER_LETTER, LATIN_UPPER_LETTER];

/// Dictionary which contains latin lower and upper letters and arabic numbers
pub const ARABIC_NUMBERS_AND_LATIN_LETTERS: [RangeInclusive<char>; 3] =
    [ARABIC_NUMBER, LATIN_LOWER_LETTER, LATIN_UPPER_LETTER];

/// Dictionary which contains latin lower letters and arabic numbers
pub const ARABIC_NUMBERS_AND_LATIN_LOWER_LETTERS: [RangeInclusive<char>; 2] =
    [ARABIC_NUMBER, LATIN_LOWER_LETTER];

/// Dictionary which contains latin upper letters and arabic numbers
pub const ARABIC_NUMBERS_AND_LATIN_UPPER_LETTERS: [RangeInclusive<char>; 2] =
    [ARABIC_NUMBER, LATIN_UPPER_LETTER];

/// Generate random password using dictionary
pub fn gen_password(length: usize, dictionary: &[RangeInclusive<char>]) -> String {
    random_bytes(length)
        .into_iter()
        .map(|byte| byte_to_char(byte, dictionary))
        .collect()
}

fn byte_to_char(byte: u8, dictionary: &[RangeInclusive<char>]) -> char {
    let length = dictionary.iter().fold(0, |length, range| {
        length + *range.end() as usize - *range.start() as usize + 1
    });
    let index = byte as usize * length / 256;
    dictionary
        .iter()
        .fold(Err(index), |found, range| {
            if let Err(index) = found {
                let len = *range.end() as usize - *range.start() as usize + 1;
                return if index < len {
                    Ok((*range.start() as u8 + index as u8) as char)
                } else {
                    Err(index - len)
                };
            }
            found
        }).unwrap()
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_byte_to_char() {
        assert_eq!(byte_to_char(0, &ARABIC_NUMBERS), '0');
        assert_eq!(byte_to_char(127, &ARABIC_NUMBERS), '4');
        assert_eq!(byte_to_char(128, &ARABIC_NUMBERS), '5');
        assert_eq!(byte_to_char(255, &ARABIC_NUMBERS), '9');

        assert_eq!(byte_to_char(0, &LATIN_LOWER_LETTERS), 'a');
        assert_eq!(byte_to_char(127, &LATIN_UPPER_LETTERS), 'M');
        assert_eq!(byte_to_char(128, &LATIN_LOWER_LETTERS), 'n');
        assert_eq!(byte_to_char(255, &LATIN_UPPER_LETTERS), 'Z');

        assert_eq!(byte_to_char(0, &LATIN_LETTERS), 'a');
        assert_eq!(byte_to_char(127, &LATIN_LETTERS), 'z');
        assert_eq!(byte_to_char(128, &LATIN_LETTERS), 'A');
        assert_eq!(byte_to_char(255, &LATIN_LETTERS), 'Z');

        assert_eq!(byte_to_char(0, &ARABIC_NUMBERS_AND_LATIN_LETTERS), '0');
        assert_eq!(byte_to_char(127, &ARABIC_NUMBERS_AND_LATIN_LETTERS), 'u');
        assert_eq!(byte_to_char(128, &ARABIC_NUMBERS_AND_LATIN_LETTERS), 'v');
        assert_eq!(byte_to_char(255, &ARABIC_NUMBERS_AND_LATIN_LETTERS), 'Z');
    }

    #[test]
    fn test_gen_password() {
        assert_eq!(gen_password(3, &LATIN_LETTERS).len(), 3);
        assert_eq!(gen_password(5, &LATIN_LETTERS).len(), 5);
        assert_eq!(gen_password(8, &LATIN_LETTERS).len(), 8);
        assert_eq!(gen_password(10, &LATIN_LETTERS).len(), 10);
    }

    #[test]
    fn test_create_and_verify_password() {
        let hashed = create_password("AbracaD@br1");
        assert_eq!(verify_password("AbracaD@br1", &hashed), true);
        assert_eq!(verify_password("AbracaD@bra", &hashed), false);
    }
}
