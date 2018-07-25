/// <reference path="sodium-native.d.ts" />
import { crypto_box_keypair, crypto_box_PUBLICKEYBYTES, crypto_box_SECRETKEYBYTES, crypto_box_seal, crypto_box_seal_open, crypto_box_SEALBYTES } from 'sodium-native';
import { Result, ok, err, some, constant, then_ok, mk_seq, wrap_future, then_future_ok } from 'literium-base';
import { Type, base64, utf8, parse, build } from 'literium-json';
import { BodyType, BinaryBody, StringBody } from 'literium-node';

export interface Codec<T, V> {
    p: (v: V) => Result<T, string>;
    b: (t: T) => Result<V, string>;
}

export function keypair(): [ArrayBuffer, ArrayBuffer] {
    const pk = Buffer.allocUnsafe(crypto_box_PUBLICKEYBYTES);
    const sk = Buffer.allocUnsafe(crypto_box_SECRETKEYBYTES);
    crypto_box_keypair(pk, sk);
    return [pk.buffer, sk.buffer];
}

export function sbox(public_key: () => ArrayBuffer, secret_key?: () => ArrayBuffer): Codec<ArrayBuffer, ArrayBuffer> {
    return {
        p: secret_key ? data => {
            const msg = Buffer.allocUnsafe(data.byteLength - crypto_box_SEALBYTES);
            return crypto_box_seal_open(msg, Buffer.from(data), Buffer.from(public_key()), Buffer.from(secret_key())) ?
                ok(msg) : err('unable to decrypt');
        } : constant(err('decryption unavailable')),
        b: data => {
            const msg = Buffer.allocUnsafe(data.byteLength + crypto_box_SEALBYTES);
            crypto_box_seal(msg, Buffer.from(data), Buffer.from(public_key()));
            return ok(msg);
        }
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

export function SBoxBody<T>(public_key: () => ArrayBuffer, secret_key: () => ArrayBuffer, content_type?: string): BodyType<ArrayBuffer> {
    const s = sbox(public_key, secret_key);
    return {
        t: some(content_type || BinaryBody.t + '+sbox'),
        p: mk_seq(
            BinaryBody.p,
            then_future_ok(wrap_future(s.p))
        ),
        b: mk_seq(
            s.b,
            then_ok(BinaryBody.b)
        )
    };
}

export function SBoxJsonBody<T>(t: Type<T>): (public_key: () => ArrayBuffer, secret_key?: () => ArrayBuffer, content_type?: string) => BodyType<T> {
    const j = sboxjson(t);
    return (public_key, secret_key, content_type) => {
        const s = j(public_key, secret_key);
        return {
            t: some(content_type || 'application/json+sbox'),
            p: mk_seq(
                BinaryBody.p,
                then_future_ok(wrap_future(s.p))
            ),
            b: mk_seq(
                s.b,
                then_ok(BinaryBody.b)
            )
        };
    };
}

export function SBoxJsonB64Body<T>(t: Type<T>): (public_key: () => ArrayBuffer, secret_key?: () => ArrayBuffer, content_type?: string) => BodyType<T> {
    const j = sboxjsonb64(t);
    return (public_key, secret_key, content_type) => {
        const s = j(public_key, secret_key);
        return {
            t: some(content_type || 'application/json+sbox'),
            p: mk_seq(
                StringBody.p,
                then_future_ok(wrap_future(s.p))
            ),
            b: mk_seq(
                s.b,
                then_ok(StringBody.b)
            )
        };
    };
}
