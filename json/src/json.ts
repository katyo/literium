import {
    ok, err, map_ok, map_err, then_ok,

    mk_seq, ok_try, err_to_str, Option, some, none, is_some, un_some, do_seq, un_some_or,
} from '@literium/base';
import { Type, TypeConv, Result } from './types';
import {
    str_check, num_check, bin_check, re_check, len_check,
    fin_check, pos_check, neg_check, int_check, nat_check
} from './check';

// Basic atomic types

export const str: Type<string> = {
    p: str_check,
    b: str_check,
};

export const num: Type<number> = {
    p: num_check,
    b: num_check,
};

export const bin: Type<boolean> = {
    p: bin_check,
    b: bin_check,
};

export const und: Type<void> = {
    p: v => v != null ? err('defined') : ok(undefined),
    b: v => v != null ? err('defined') : ok(null),
};

// Extra numeric types

export const fin: Type<number> = {
    p: fin_check,
    b: fin_check,
};

export const pos: Type<number> = {
    p: pos_check,
    b: pos_check,
};

export const neg: Type<number> = {
    p: neg_check,
    b: neg_check,
};

export const int: Type<number> = {
    p: int_check,
    b: int_check,
};

export const nat: Type<number> = {
    p: nat_check,
    b: nat_check,
};

// DateTime types

export const date_msec: Type<Date> = {
    p: /*@__PURE__*/mk_seq(nat_check, map_ok(v => new Date(v))),
    b: v => v instanceof Date ? ok(v.getTime()) : err('!date'),
}

export const date_unix: Type<Date> = {
    p: /*@__PURE__*/mk_seq(nat_check, map_ok(v => new Date(v * 1000))),
    b: v => v instanceof Date ? ok((v.getTime() / 1000) | 0) : err('!date'),
}

// RegExp matched string

export function regex(re: RegExp, cause?: string): TypeConv<string, string> {
    const c = re_check(re, cause);
    return then(c, c);
}

// Container types

export function list<T>(t: Type<T>): Type<T[]> {
    return {
        p(v) {
            if (!Array.isArray(v)) return err('!array');
            const r: T[] = new Array(v.length);
            for (let i = 0; i < v.length; i++) {
                const e = t.p(v[i]);
                if (!e.$) return err(`[${i}] ${e._}`);
                r[i] = e._;
            }
            return ok(r);
        },
        b(v) {
            if (!Array.isArray(v)) return err('!array');
            const r: any[] = new Array(v.length);
            for (let i = 0; i < v.length; i++) {
                const e = t.b(v[i]);
                if (!e.$) return err(`[${i}] ${e._}`);
                r[i] = e._;
            }
            return ok(r);
        }
    };
}

export function len<T extends ArrayLike<any>>(min: Option<number>, max: Option<number>): TypeConv<T, T> {
    const min_ = un_some_or(-Infinity)(min);
    const max_ = un_some_or(Infinity)(max);
    const c = len_check(min_, max_);
    return (t: Type<T>) => ({
        p: mk_seq(t.p, then_ok(c)),
        b: mk_seq(c, then_ok(t.b)),
    });
}

export type Dict<T extends Object> = { [Tag in keyof T]: Type<T[Tag]> };

export function dict<T extends Object>(t: Dict<T>): Type<T> {
    return {
        p(v) {
            if (typeof v != 'object' ||
                Array.isArray(v)) return err('!object');
            const r = {} as T;
            for (const k in t) {
                const e = t[k].p(v[k]);
                if (!e.$) return err(`.${k} ${k in v ? e._ : "missing"}`);
                if (e._ != null) r[k] = e._;
            }
            return ok(r);
        },
        b(v) {
            if (typeof v != 'object' ||
                Array.isArray(v)) return err('!object');
            const r = {} as any;
            for (const k in t) {
                const e = t[k].b(v[k]);
                if (!e.$) return err(`.${k} ${k in v ? e._ : "missing"}`);
                if (e._ != null) r[k] = e._;
            }
            return ok(r);
        }
    };
}

export function mix<T1 extends Object>(t1: Type<T1>): Type<T1>;
export function mix<T1 extends Object, T2 extends Object>(t1: Type<T1>, t2: Type<T2>): Type<T1 & T2>;
export function mix<T1 extends Object, T2 extends Object, T3 extends Object>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>): Type<T1 & T2 & T3>;
export function mix<T1 extends Object, T2 extends Object, T3 extends Object, T4 extends Object>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>): Type<T1 & T2 & T3 & T4>;
export function mix<T1 extends Object, T2 extends Object, T3 extends Object, T4 extends Object, T5 extends Object>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>): Type<T1 & T2 & T3 & T4 & T5>;
export function mix<T1 extends Object, T2 extends Object, T3 extends Object, T4 extends Object, T5 extends Object, T6 extends Object>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>, t6: Type<T6>): Type<T1 & T2 & T3 & T4 & T5 & T6>;
export function mix<T1 extends Object, T2 extends Object, T3 extends Object, T4 extends Object, T5 extends Object, T6 extends Object, T7 extends Object>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>, t6: Type<T6>, t7: Type<T7>): Type<T1 & T2 & T3 & T4 & T5 & T6 & T7>;
export function mix<T1 extends Object, T2 extends Object, T3 extends Object, T4 extends Object, T5 extends Object, T6 extends Object, T7 extends Object, T8 extends Object>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>, t6: Type<T6>, t7: Type<T7>, t8: Type<T8>): Type<T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8>;
export function mix<T1 extends Object, T2 extends Object, T3 extends Object, T4 extends Object, T5 extends Object, T6 extends Object, T7 extends Object, T8 extends Object, T9 extends Object>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>, t6: Type<T6>, t7: Type<T7>, t8: Type<T8>, t9: Type<T9>): Type<T1 & T2 & T3 & T4 & T5 & T6 & T7 & T9>;

export function mix(...ts: Type<Object>[]): Type<Object> {
    return {
        p(v) {
            let r = {};
            for (const t of ts) {
                const x = t.p(v);
                if (!x.$) return x;
                r = { ...r, ...x._ };
            }
            return ok(r);
        },
        b(v) {
            let r = {};
            for (const t of ts) {
                const x = t.b(v);
                if (!x.$) return x;
                r = { ...r, ...x._ };
            }
            return ok(r);
        }
    };
}

export function tup<T1>(t1: Type<T1>): Type<[T1]>;
export function tup<T1, T2>(t1: Type<T1>, t2: Type<T2>): Type<[T1, T2]>;
export function tup<T1, T2, T3>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>): Type<[T1, T2, T3]>;
export function tup<T1, T2, T3, T4>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>): Type<[T1, T2, T3, T4]>;
export function tup<T1, T2, T3, T4, T5>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>): Type<[T1, T2, T3, T4, T5]>;
export function tup<T1, T2, T3, T4, T5, T6>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>, t6: Type<T6>): Type<[T1, T2, T3, T4, T5, T6]>;
export function tup<T1, T2, T3, T4, T5, T6, T7>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>, t6: Type<T6>, t7: Type<T7>): Type<[T1, T2, T3, T4, T5, T6, T7]>;
export function tup<T1, T2, T3, T4, T5, T6, T7, T8>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>, t6: Type<T6>, t7: Type<T7>, t8: Type<T8>): Type<[T1, T2, T3, T4, T5, T6, T7, T8]>;
export function tup<T1, T2, T3, T4, T5, T6, T7, T8, T9>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>, t6: Type<T6>, t7: Type<T7>, t8: Type<T8>, t9: Type<T9>): Type<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;
export function tup(...ts: Type<any>[]): Type<any[]> {
    return {
        p(v) {
            if (!Array.isArray(v)) return err('!tuple');
            if (v.length < ts.length) return err('insufficient');
            if (v.length > ts.length) return err('exceeded');
            const r: any[] = new Array(v.length);
            for (let i = 0; i < ts.length; i++) {
                const e = ts[i].p(v[i]);
                if (!e.$) return err(`[${i}] ${e._}`);
                r[i] = e._;
            }
            return ok(r);
        },
        b(v) {
            if (!Array.isArray(v)) return err('!tuple');
            if (v.length < ts.length) return err('insufficient');
            if (v.length > ts.length) return err('exceeded');
            const r: any[] = new Array(v.length);
            for (let i = 0; i < v.length; i++) {
                const e = ts[i].b(v[i]);
                if (!e.$) return err(`[${i}] ${e._}`);
                r[i] = e._;
            }
            return ok(r);
        }
    };
}

// Type modifiers

const and_defined = /*@__PURE__*/map_err((e: string) => `${e} & defined`);

export function opt<T>(t: Type<T>): Type<T | void> {
    return {
        p: v => v != null ? and_defined(t.p(v)) : ok(undefined),
        b: v => v != undefined ? and_defined(t.b(v)) : ok(null),
    };
}

export function val<T>(d: T): Type<T> {
    return {
        p: () => ok(d),
        b: () => ok(null),
    };
}

export function def<T>(d: T): TypeConv<T, T> {
    return (t: Type<T>) => ({
        p: v => v != null ? and_defined(t.p(v)) : ok(d),
        b: v => v != d ? t.b(v) : ok(null),
    });
}

export function map<T, R>(p: (v: T) => R, b: (v: R) => T): TypeConv<T, R> {
    const map_p = map_ok(p);
    return t => ({
        p: v => map_p(t.p(v)),
        b: v => t.b(b(v)),
    });
}

export function then<T, R>(p: (v: T) => Result<R>, b: (v: R) => Result<T>): TypeConv<T, R> {
    const then_p = then_ok(p);
    return t => {
        const then_b = then_ok(t.b);
        return {
            p: v => then_p(t.p(v)),
            b: v => then_b(b(v)),
        };
    };
}

export function chain<T, R>(t: Type<R>): TypeConv<T, R> {
    return then(t.p, t.b);
}

export function option<T>(t: Type<T>): Type<Option<T>> {
    return {
        p: v => v != null ? and_defined(do_seq(t.p(v), map_ok(some))) : ok(none()),
        b: v => is_some(v) ? and_defined(t.b(un_some(v))) : ok(null),
    };
}

export function unless<T>(fn: () => Result<T>): TypeConv<T, T> {
    return (t: Type<T>) => ({
        p: v => v != null ? and_defined(t.p(v)) : fn(),
        b: v => v != null ? and_defined(t.b(v)) : fn(),
    });
}

// Type alternatives

export function alt<T1, T2>(t1: Type<T1>, t2: Type<T2>): Type<T1 | T2>;
export function alt<T1, T2, T3>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>): Type<T1 | T2 | T3>;
export function alt<T1, T2, T3, T4>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>): Type<T1 | T2 | T4>;
export function alt<T1, T2, T3, T4, T5>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>): Type<T1 | T2 | T4 | T5>;
export function alt<T1, T2, T3, T4, T5, T6>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>, t6: Type<T6>): Type<T1 | T2 | T4 | T5 | T6>;
export function alt<T1, T2, T3, T4, T5, T6, T7>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>, t6: Type<T6>, t7: Type<T7>): Type<T1 | T2 | T4 | T5 | T6 | T7>;
export function alt<T1, T2, T3, T4, T5, T6, T7, T8>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>, t6: Type<T6>, t7: Type<T7>, t8: Type<T8>): Type<T1 | T2 | T4 | T5 | T6 | T7 | T8>;
export function alt<T1, T2, T3, T4, T5, T6, T7, T8, T9>(t1: Type<T1>, t2: Type<T2>, t3: Type<T3>, t4: Type<T4>, t5: Type<T5>, t6: Type<T6>, t7: Type<T7>, t8: Type<T8>, t9: Type<T9>): Type<T1 | T2 | T4 | T5 | T6 | T7 | T8 | T9>;
export function alt(...ts: Type<any>[]): Type<any> {
    return {
        p(v) {
            const es: string[] = [];
            for (const t of ts) {
                const r = t.p(v);
                if (r.$) return r;
                es.push(r._);
            }
            return err(`${es.join(' & ')}`);
        },
        b(v) {
            const es: string[] = [];
            for (const t of ts) {
                const r = t.b(v);
                if (r.$) return r;
                es.push(r._);
            }
            return err(`${es.join(' & ')}`);
        },
    };
}

// Conversion API

export function parse_js<T>(parser: Type<T>): (raw: any) => Result<T> {
    return parser.p;
}

export function parse<T>(parser: Type<T>): (str: string) => Result<T> {
    return mk_seq(
        ok_try(JSON.parse),
        map_err(err_to_str),
        then_ok(parser.p),
    );
}

export function build_js<T>(parser: Type<T>): (data: T) => Result<any> {
    return parser.b;
}

export function build<T>(builder: Type<T>): (data: T) => Result<string> {
    return mk_seq(
        builder.b,
        then_ok(mk_seq(
            ok_try(JSON.stringify),
            map_err(err_to_str)
        ))
    );
}
