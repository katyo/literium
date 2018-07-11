import {
    Result as _Result,
    ok, err, map_ok, map_err, then_ok,

    mk_seq, ok_try, err_to_str
} from 'literium-base';

export type Result<Type> = _Result<Type, string>;

export interface Type<T> {
    p(v: any): Result<T>; // parse
    b(v: T): Result<any>; // build
}

// Basic atomic types

export const str: Type<string> = {
    p: v => typeof v != 'string' ? err('!string') : ok(v),
    b: v => typeof v != 'string' ? err('!string') : ok(v),
};

export const num: Type<number> = {
    p: v => typeof v != 'number' ? err('!number') : ok(v),
    b: v => typeof v != 'number' ? err('!number') : ok(v),
};

export const bin: Type<boolean> = {
    p: v => typeof v != 'boolean' ? err('!boolean') : ok(v),
    b: v => typeof v != 'boolean' ? err('!boolean') : ok(v),
};

export const und: Type<void> = {
    p: v => v != null ? err('defined') : ok(undefined),
    b: v => v != null ? err('defined') : ok(null),
};

// Extra numeric types

const fin_check = then_ok<number, string, number>(v => isFinite(v) ? ok(v) : err('infinite'));

export const fin: Type<number> = {
    p: v => fin_check(num.p(v)),
    b: v => fin_check(num.b(v)),
};

const pos_check = then_ok<number, string, number>(v => v < 0 ? err('negative') : ok(v));

export const pos: Type<number> = {
    p: v => pos_check(num.p(v)),
    b: v => pos_check(num.b(v)),
};

const neg_check = then_ok<number, string, number>(v => v > 0 ? err('positive') : ok(v));

export const neg: Type<number> = {
    p: v => neg_check(num.p(v)),
    b: v => neg_check(num.b(v)),
};

const int_check = then_ok<number, string, number>(v => v % 1 ? err('!integer') : ok(v));

export const int: Type<number> = {
    p: v => int_check(fin.p(v)),
    b: v => int_check(fin.b(v)),
};

export const nat: Type<number> = {
    p: v => pos_check(int.p(v)),
    b: v => pos_check(int.b(v)),
};

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

export type Dict<T> = { [Tag in keyof T]: Type<T[Tag]> };

export function dict<T>(t: Dict<T>): Type<T> {
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
const and_defined = map_err((e: string) => `${e} & defined`);

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

export function def<T>(t: Type<T>, d: T): Type<T> {
    return {
        p: v => v != null ? and_defined(t.p(v)) : ok(d),
        b: v => v != d ? t.b(v) : ok(null),
    };
}

export function map<T, R>(p: (v: T) => R, b: (v: R) => T): (t: Type<T>) => Type<R> {
    const map_p = map_ok(p);
    return t => ({
        p: v => map_p(t.p(v)),
        b: v => t.b(b(v)),
    });
}

export function then<T, R>(p: (v: T) => Result<R>, b: (v: R) => Result<T>): (t: Type<T>) => Type<R> {
    const then_p = then_ok(p);
    return t => {
        const then_b = then_ok(t.b);
        return {
            p: v => then_p(t.p(v)),
            b: v => then_b(b(v)),
        };
    };
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
