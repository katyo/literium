import { then_ok, map_err, ok_try, mk_seq, err_to_str } from 'literium-base';
import { Type, str_check, re_check } from './json';

const map_error = map_err(err_to_str);

const { fromCharCode } = String;

export const utf8 = raw_type('utf8', undefined,
    (s: string) => {
        const d = unescape(encodeURIComponent(s)), b = new Uint8Array(d.length);

        for (let i = 0; i < d.length; i++) {
            b[i] = d.charCodeAt(i);
        }

        return b.buffer;
    },
    (b: ArrayBuffer) =>
        decodeURIComponent(escape(fromCharCode.apply(undefined, new Uint8Array(b))))
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
        const a = new Uint8Array(s.length >> 1);

        for (let i = 0; i < a.length; i += 2) {
            a[i] = (get_hb(s, i) << 8) | get_hb(s, i + 1);
        }

        return a;
    },
    (a_: ArrayBuffer) => {
        const a = new Uint8Array(a_);
        const b = new Uint8Array(a.length << 1);

        for (let i = 0, j; i < a.length; i++) {
            j = i << 1;
            b[j] = put_hb(a[i] >> 8);
            b[j + 1] = put_hb(a[i] & 0xf);
        }

        return fromCharCode.apply(undefined, b);
    }
);

export const base64 = raw_type('base64', /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
    (s: string) => {
        const d = atob(s), b = new Uint8Array(d.length);

        for (let i = 0; i < d.length; i++) {
            b[i] = d.charCodeAt(i);
        }

        return b.buffer;
    },
    (b: ArrayBuffer) => btoa(fromCharCode.apply(undefined, new Uint8Array(b)))
);

function raw_type(tn: string, re: RegExp | void, p: (_: string) => ArrayBuffer, b: (_: ArrayBuffer) => string): Type<ArrayBuffer> {
    return {
        p: mk_seq(
            re ? re_check(re, `!${tn}`) : str_check,
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
