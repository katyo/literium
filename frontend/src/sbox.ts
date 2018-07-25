import { Result, ok, err, constant, map_ok, ok_def_or, do_seq, mk_seq, then_ok } from 'literium-base';
import { Type, utf8, base64, then, build, parse } from 'literium-json';
import { BodyType, DataType } from 'literium-request';
import { ByteArray, sealedbox, SealedBoxLength, sealedbox_open, box_keyPair } from 'tweetnacl-ts';

export interface Codec<T, V> {
    p: (v: V) => Result<T, string>;
    b: (t: T) => Result<V, string>;
}

export const base64_key = /*@__PURE__*/then(key_check, key_check)(base64);

function key_check(_: ArrayBuffer): Result<ArrayBuffer, string> {
    return _.byteLength == SealedBoxLength.PublicKey ? ok(_) : err('invalid key');
}

export function keypair(): [ArrayBuffer, ArrayBuffer] {
    const { publicKey, secretKey } = box_keyPair();
    return [publicKey.buffer, secretKey.buffer];
}

export function sbox(public_key: () => ArrayBuffer, secret_key?: () => ArrayBuffer): Codec<ArrayBuffer, ArrayBuffer> {
    return {
        p: secret_key ? data => do_seq(
            ok_def_or('unable to decrypt')
                (sealedbox_open(ByteArray(data), ByteArray(public_key()), ByteArray(secret_key()))),
            map_ok(b => b.buffer)
        ) : constant(err('decryption unavailable')),
        b: data => ok(sealedbox(ByteArray(data), ByteArray(public_key())).buffer),
    };
}

export function sboxjson<T>(t: Type<T>): (public_key: () => ArrayBuffer, secret_key?: () => ArrayBuffer) => Codec<T, ArrayBuffer> {
    return (public_key, secret_key) => {
        const s = sbox(public_key, secret_key);
        return {
            p: mk_seq(s.p, then_ok(utf8.b), then_ok(parse(t))),
            b: mk_seq(build(t), then_ok(utf8.p), then_ok(s.b)),
        };
    };
}

export function sboxjsonb64<T>(t: Type<T>): (public_key: () => ArrayBuffer, secret_key?: () => ArrayBuffer) => Codec<T, string> {
    const j = sboxjson(t);
    return (public_key, secret_key) => {
        const s = j(public_key, secret_key);
        return {
            p: mk_seq(base64.p, then_ok(s.p)),
            b: mk_seq(s.b, then_ok(base64.b)),
        };
    };
}

export function SBoxBody(public_key: () => ArrayBuffer, secret_key?: () => ArrayBuffer): BodyType<ArrayBuffer, DataType.Binary> {
    return {
        ...sbox(public_key, secret_key),
        t: DataType.Binary
    };
}

export function SBoxJsonBody<T>(t: Type<T>): (public_key: () => ArrayBuffer, secret_key?: () => ArrayBuffer) => BodyType<T, DataType.Binary> {
    const j = sboxjson(t);
    return (public_key, secret_key) => {
        return {
            ...j(public_key, secret_key),
            t: DataType.Binary
        };
    };
}

export function SBoxJsonB64Body<T>(t: Type<T>): (public_key: () => ArrayBuffer, secret_key?: () => ArrayBuffer) => BodyType<T, DataType.String> {
    const j = sboxjsonb64(t);
    return (public_key, secret_key) => {
        return {
            ...j(public_key, secret_key),
            t: DataType.String
        };
    };
}
