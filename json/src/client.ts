import { then_ok, map_err, ok_try, mk_seq, err_to_str, identity } from 'literium-base';
import { Type } from './types';
import { str_check, re_check } from './check';

const map_error = map_err(err_to_str);

export const utf8 = raw_type('utf8', undefined,
    (s: string) => {
        const d = unescape(encodeURIComponent(s)), b = u8_arr(d.length);

        for (let i = 0; i < d.length; i++) {
            b[i] = d.charCodeAt(i);
        }

        return b.buffer;
    },
    (b: ArrayBuffer) =>
        decodeURIComponent(escape(to_str(u8_arr(b))))
);

function put_hb(h: number): number {
    return h + (h < 10 ? 48 : 87);
}

function get_hb(s: string, i: number): number {
    const c = s.charCodeAt(i);
    return c - (c < 58 ? 48 : c < 71 ? 55 : 87);
}

export const hex = raw_type('hex', /^(?:[A-Fa-f0-9]{2})+$/,
    (s: string) => {
        const a = u8_arr(s.length >> 1);

        for (let i = 0; i < a.length; i += 2) {
            a[i] = (get_hb(s, i) << 8) | get_hb(s, i + 1);
        }

        return a;
    },
    (a_: ArrayBuffer) => /**@__PURE__*/ {
        const a = u8_arr(a_);
        const b = u8_arr(a.length << 1);

        for (let i = 0, j; i < a.length; i++) {
            j = i << 1;
            b[j] = put_hb(a[i] >> 8);
            b[j + 1] = put_hb(a[i] & 0xf);
        }

        return to_str(b);
    }
);

export const base64 = raw_type('base64', /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
    (s: string) => {
        const d = atob(s), b = u8_arr(d.length);

        for (let i = 0; i < d.length; i++) {
            b[i] = d.charCodeAt(i);
        }

        return b.buffer;
    },
    (b: ArrayBuffer) => btoa(to_str(u8_arr(b)))
);

function raw_type(tn: string, re: RegExp | void, p: (_: string) => ArrayBuffer, b: (_: ArrayBuffer) => string): Type<ArrayBuffer> {
    return {
        p: mk_seq(
            str_check,
            re ? then_ok(re_check(re, `!${tn}`)) : identity,
            str_check,
            then_ok(mk_seq(
                ok_try(p),
                map_error
            ))
        ),
        b: mk_seq(
            ok_try(b),
            map_error
        )
    };
}

function u8_arr(a: ArrayBuffer | ArrayLike<number> | number): Uint8Array {
    return new Uint8Array(a as number);
}

function to_str(a: ArrayLike<number>): string {
    return String.fromCharCode.apply(null, a);
}
