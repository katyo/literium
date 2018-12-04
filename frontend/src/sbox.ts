import { HasField, Result, ok, err, ok_def_or, mk_seq, then_ok } from '@literium/base';
import { Type, utf8, base64, then, build, parse } from '@literium/json';
import { FromArg, IntoRes, mix_plugin, header_use, header_expect, body_from, body_into } from '@literium/request';
import { ByteArray, sealedbox, SealedBoxLength, sealedbox_open, box_keyPair } from 'tweetnacl-ts';

export const base64_key = /*@__PURE__*/then(key_check, key_check)(base64);

function key_check(_: ArrayBuffer): Result<ArrayBuffer, string> {
    return _.byteLength == SealedBoxLength.PublicKey ? ok(_) : err('invalid key');
}

export type PubKey = ArrayBuffer;

export type KeyPair = [PubKey, ArrayBuffer];

export function keypair(): KeyPair {
    const { publicKey, secretKey } = box_keyPair();
    return [publicKey.buffer, secretKey.buffer];
}

export interface XFromArg<K, T> {
    <F extends keyof A, A extends HasField<F, K>>(field: F): FromArg<T, A>;
    (key: K): FromArg<T>;
}

export interface XIntoRes<K, T> {
    <F extends keyof A, A extends HasField<F, K>>(field: F): IntoRes<T, A>;
    (keys: K): IntoRes<T>;
}

export function x_json_enc<T>(ty: Type<T>): (public_key: ArrayBuffer) => (value: T) => Result<string, string> {
    const json_enc = build(ty);
    return public_key => mk_seq(
        json_enc,
        then_ok(utf8.p),
        then_ok(data => ok(sealedbox(ByteArray(data), ByteArray(public_key)).buffer)),
        then_ok(base64.b)
    );
}

export function x_json_from<T>(ty: Type<T>, ct: string = 'application/x-base64-sealed-json'): XFromArg<ArrayBuffer, T> {
    const x_json = x_json_enc(ty);
    return (key_or_field: ArrayBuffer | string) => (field?: string) => mix_plugin(
        header_use('content-type', ct),
        body_from()((data: T, arg: any) => x_json(typeof key_or_field == 'string' ? arg[key_or_field] : key_or_field)(data))(field)
    );
}

export function x_json_dec<T>(ty: Type<T>): (public_key: ArrayBuffer, secret_key: ArrayBuffer) => (value: string) => Result<T, string> {
    const json_dec = parse(ty);
    return (public_key, secret_key) => mk_seq(
        base64.p,
        then_ok(data => ok_def_or('unable to decrypt')
                (sealedbox_open(ByteArray(data), ByteArray(public_key), ByteArray(secret_key)))),
        then_ok(utf8.b),
        then_ok(json_dec)
    );
}

export function x_json_into<T>(ty: Type<T>, ct: string | RegExp = 'x-base64-sealed-json'): XIntoRes<KeyPair, T> {
    const x_json = x_json_dec(ty);
    return (keys_or_field: KeyPair | string) => (field?: string) => mix_plugin(
        header_expect('content-type', ct),
        body_into()((data: string, arg: any) => x_json(...(typeof keys_or_field == 'string' ? arg[keys_or_field] : keys_or_field) as KeyPair)(data))(field)
    );
}
