import { then_ok, map_err, ok_try, mk_seq, err_to_str, identity } from 'literium-base';
import { Type } from './types';
import { str_check, re_check } from './check';

const map_error = map_err(err_to_str);

export const utf8 = raw_type('utf8');

export const hex = raw_type('hex', /^(?:[A-Fa-f0-9]{2})+$/);

export const base64 = raw_type('base64', /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/);

function raw_type(tn: string, re?: RegExp): Type<ArrayBuffer> {
    return {
        p: mk_seq(
            str_check,
            re ? then_ok(re_check(re, `!${tn}`)) : identity,
            then_ok(mk_seq(
                ok_try((s: string) => Buffer.from(s, tn).buffer),
                map_error
            ))
        ),
        b: mk_seq(
            ok_try((v: ArrayBuffer) => Buffer.from(v).toString(tn)),
            map_error
        )
    };
}
