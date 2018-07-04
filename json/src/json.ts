import { Result, ok, err, map_ok, map_err, then_ok, mk_seq, ok_try, err_to_str } from 'literium-base';

export type JsonResult<Type> = Result<Type, string>;

export interface JsonType<Type> {
    p(v: any): JsonResult<Type>; // parse
    b(v: Type): JsonResult<any>; // build
}

// Basic atomic types

export const str: JsonType<string> = {
    p: v => typeof v != 'string' ? err('!string') : ok(v),
    b: v => typeof v != 'string' ? err('!string') : ok(v),
};

export const num: JsonType<number> = {
    p: v => typeof v != 'number' ? err('!number') : ok(v),
    b: v => typeof v != 'number' ? err('!number') : ok(v),
};

export const bin: JsonType<boolean> = {
    p: v => typeof v != 'boolean' ? err('!boolean') : ok(v),
    b: v => typeof v != 'boolean' ? err('!boolean') : ok(v),
};

export const und: JsonType<void> = {
    p: v => v != null ? err('defined') : ok(undefined),
    b: v => v != null ? err('defined') : ok(null),
};

// Extra numeric types

const fin_check = then_ok<number, string, number>(v => isFinite(v) ? ok(v) : err('infinite'));

export const fin: JsonType<number> = {
    p: v => fin_check(num.p(v)),
    b: v => fin_check(num.b(v)),
};

const pos_check = then_ok<number, string, number>(v => v < 0 ? err('negative') : ok(v));

export const pos: JsonType<number> = {
    p: v => pos_check(num.p(v)),
    b: v => pos_check(num.b(v)),
};

const neg_check = then_ok<number, string, number>(v => v > 0 ? err('positive') : ok(v));

export const neg: JsonType<number> = {
    p: v => neg_check(num.p(v)),
    b: v => neg_check(num.b(v)),
};

const int_check = then_ok<number, string, number>(v => v % 1 ? err('!integer') : ok(v));

export const int: JsonType<number> = {
    p: v => int_check(fin.p(v)),
    b: v => int_check(fin.b(v)),
};

export const nat: JsonType<number> = {
    p: v => pos_check(int.p(v)),
    b: v => pos_check(int.b(v)),
};

// Container types

export function list<Type>(t: JsonType<Type>): JsonType<Type[]> {
    return {
        p(v) {
            if (!Array.isArray(v)) return err('!array');
            const r: Type[] = new Array(v.length);
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

export type JsonDict<TypeMap> = { [Tag in keyof TypeMap]: JsonType<TypeMap[Tag]> };

export function dict<TypeMap>(t: JsonDict<TypeMap>): JsonType<TypeMap> {
    return {
        p(v) {
            if (typeof v != 'object' ||
                Array.isArray(v)) return err('!object');
            const r = {} as TypeMap;
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

export function tup<Type1, Type2>(t1: JsonType<Type1>, t2: JsonType<Type2>): JsonType<[Type1, Type2]>;
export function tup<Type1, Type2, Type3>(t1: JsonType<Type1>, t2: JsonType<Type2>, t3: JsonType<Type3>): JsonType<[Type1, Type2, Type3]>;
export function tup<Type1, Type2, Type3, Type4>(t1: JsonType<Type1>, t2: JsonType<Type2>, t3: JsonType<Type3>, t4: JsonType<Type4>): JsonType<[Type1, Type2, Type3, Type4]>;
export function tup<Type1, Type2, Type3, Type4, Type5>(t1: JsonType<Type1>, t2: JsonType<Type2>, t3: JsonType<Type3>, t4: JsonType<Type4>, t5: JsonType<Type5>): JsonType<[Type1, Type2, Type3, Type4, Type5]>;
export function tup<Type1, Type2, Type3, Type4, Type5, Type6>(t1: JsonType<Type1>, t2: JsonType<Type2>, t3: JsonType<Type3>, t4: JsonType<Type4>, t5: JsonType<Type5>, t6: JsonType<Type6>): JsonType<[Type1, Type2, Type3, Type4, Type5, Type6]>;
export function tup<Type1, Type2, Type3, Type4, Type5, Type6, Type7>(t1: JsonType<Type1>, t2: JsonType<Type2>, t3: JsonType<Type3>, t4: JsonType<Type4>, t5: JsonType<Type5>, t6: JsonType<Type6>, t7: JsonType<Type7>): JsonType<[Type1, Type2, Type3, Type4, Type5, Type6, Type7]>;
export function tup<Type1, Type2, Type3, Type4, Type5, Type6, Type7, Type8>(t1: JsonType<Type1>, t2: JsonType<Type2>, t3: JsonType<Type3>, t4: JsonType<Type4>, t5: JsonType<Type5>, t6: JsonType<Type6>, t7: JsonType<Type7>, t8: JsonType<Type8>): JsonType<[Type1, Type2, Type3, Type4, Type5, Type6, Type7, Type8]>;
export function tup<Type1, Type2, Type3, Type4, Type5, Type6, Type7, Type8, Type9>(t1: JsonType<Type1>, t2: JsonType<Type2>, t3: JsonType<Type3>, t4: JsonType<Type4>, t5: JsonType<Type5>, t6: JsonType<Type6>, t7: JsonType<Type7>, t8: JsonType<Type8>, t9: JsonType<Type9>): JsonType<[Type1, Type2, Type3, Type4, Type5, Type6, Type7, Type8, Type9]>;
export function tup(...ts: JsonType<any>[]): JsonType<any[]> {
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

export function opt<Type>(t: JsonType<Type>): JsonType<Type | void> {
    return {
        p: v => v != null ? and_defined(t.p(v)) : ok(undefined),
        b: v => v != undefined ? and_defined(t.b(v)) : ok(null),
    };
}

export function val<Type>(d: Type): JsonType<Type> {
    return {
        p: () => ok(d),
        b: () => ok(null),
    };
}

export function def<Type>(t: JsonType<Type>, d: Type): JsonType<Type> {
    return {
        p: v => v != null ? and_defined(t.p(v)) : ok(d),
        b: v => v != d ? t.b(v) : ok(null),
    };
}

export function map<Type, NewType>(p: (v: Type) => NewType, b: (v: NewType) => Type): (t: JsonType<Type>) => JsonType<NewType> {
    const map_p = map_ok(p);
    return t => ({
        p: v => map_p(t.p(v)),
        b: v => t.b(b(v)),
    });
}

export function then<Type, NewType>(p: (v: Type) => JsonResult<NewType>, b: (v: NewType) => JsonResult<Type>): (t: JsonType<Type>) => JsonType<NewType> {
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

export function alt<Type1, Type2>(t1: JsonType<Type1>, t2: JsonType<Type2>): JsonType<Type1 | Type2>;
export function alt<Type1, Type2, Type3>(t1: JsonType<Type1>, t2: JsonType<Type2>, t3: JsonType<Type3>): JsonType<Type1 | Type2 | Type3>;
export function alt<Type1, Type2, Type3, Type4>(t1: JsonType<Type1>, t2: JsonType<Type2>, t3: JsonType<Type3>, t4: JsonType<Type4>): JsonType<Type1 | Type2 | Type4>;
export function alt<Type1, Type2, Type3, Type4, Type5>(t1: JsonType<Type1>, t2: JsonType<Type2>, t3: JsonType<Type3>, t4: JsonType<Type4>, t5: JsonType<Type5>): JsonType<Type1 | Type2 | Type4 | Type5>;
export function alt<Type1, Type2, Type3, Type4, Type5, Type6>(t1: JsonType<Type1>, t2: JsonType<Type2>, t3: JsonType<Type3>, t4: JsonType<Type4>, t5: JsonType<Type5>, t6: JsonType<Type6>): JsonType<Type1 | Type2 | Type4 | Type5 | Type6>;
export function alt<Type1, Type2, Type3, Type4, Type5, Type6, Type7>(t1: JsonType<Type1>, t2: JsonType<Type2>, t3: JsonType<Type3>, t4: JsonType<Type4>, t5: JsonType<Type5>, t6: JsonType<Type6>, t7: JsonType<Type7>): JsonType<Type1 | Type2 | Type4 | Type5 | Type6 | Type7>;
export function alt<Type1, Type2, Type3, Type4, Type5, Type6, Type7, Type8>(t1: JsonType<Type1>, t2: JsonType<Type2>, t3: JsonType<Type3>, t4: JsonType<Type4>, t5: JsonType<Type5>, t6: JsonType<Type6>, t7: JsonType<Type7>, t8: JsonType<Type8>): JsonType<Type1 | Type2 | Type4 | Type5 | Type6 | Type7 | Type8>;
export function alt<Type1, Type2, Type3, Type4, Type5, Type6, Type7, Type8, Type9>(t1: JsonType<Type1>, t2: JsonType<Type2>, t3: JsonType<Type3>, t4: JsonType<Type4>, t5: JsonType<Type5>, t6: JsonType<Type6>, t7: JsonType<Type7>, t8: JsonType<Type8>, t9: JsonType<Type9>): JsonType<Type1 | Type2 | Type4 | Type5 | Type6 | Type7 | Type8 | Type9>;
export function alt(...ts: JsonType<any>[]): JsonType<any> {
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

export function parse_js<Type>(parser: JsonType<Type>): (raw: any) => JsonResult<Type> {
    return parser.p;
}

export function parse<Type>(parser: JsonType<Type>): (str: string) => JsonResult<Type> {
    return mk_seq(
        ok_try(JSON.parse),
        map_err(err_to_str),
        then_ok(parser.p),
    );
}

export function build_js<Type>(parser: JsonType<Type>): (data: Type) => JsonResult<any> {
    return parser.b;
}

export function build<Type>(builder: JsonType<Type>): (data: Type) => JsonResult<string> {
    return mk_seq(
        builder.b,
        ok_try(JSON.stringify),
        map_err(err_to_str)
    );
}
