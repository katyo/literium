import { Result, result_ok as ok, result_err as err } from 'literium';

export type JsonResult<Type> = Result<Type, string>;

export interface JsonType<Type> {
    p(v: any): JsonResult<Type>; // parse
    b(v: Type): JsonResult<any>; // build
}

// Basic atomic types

export const str: JsonType<string> = {
    p(v) { return typeof v != 'string' ? err('!string') : ok(v); },
    b(v) { return typeof v != 'string' ? err('!string') : ok(v); }
};

export const num: JsonType<number> = {
    p(v) { return typeof v != 'number' ? err('!number') : ok(v); },
    b(v) { return typeof v != 'number' ? err('!number') : ok(v); }
};

export const bin: JsonType<boolean> = {
    p(v) { return typeof v != 'boolean' ? err('!boolean') : ok(v); },
    b(v) { return typeof v != 'boolean' ? err('!boolean') : ok(v); }
};

export const und: JsonType<void> = {
    p(v) { return v != null ? err('defined') : ok(undefined); },
    b(v) { return v != null ? err('defined') : ok(null); }
};

// Extra numeric types

export const fin: JsonType<number> = {
    p(v) { const n = num.p(v); return !n.$ ? n : !isFinite(v) ? err('infinite') : ok(v); },
    b(v) { const n = num.b(v); return !n.$ ? n : !isFinite(v) ? err('infinite') : ok(v); }
};

export const pos: JsonType<number> = {
    p(v) { const n = num.p(v); return !n.$ ? n : v < 0 ? err('negative') : ok(v); },
    b(v) { const n = num.b(v); return !n.$ ? n : v < 0 ? err('negative') : ok(v); }
};

export const neg: JsonType<number> = {
    p(v) { const n = num.p(v); return !n.$ ? n : v > 0 ? err('positive') : ok(v); },
    b(v) { const n = num.b(v); return !n.$ ? n : v > 0 ? err('positive') : ok(v); }
};

function is_int(v: any): boolean {
    return typeof v == 'number' && isFinite(v) && !(v % 1);
}

export const int: JsonType<number> = {
    p(v) { const n = num.p(v); return !n.$ ? n : !is_int(v) ? err('!integer') : ok(v); },
    b(v) { const n = num.b(v); return !n.$ ? n : !is_int(v) ? err('!integer') : ok(v); }
};

export const nat: JsonType<number> = {
    p(v) { const n = int.p(v); return !n.$ ? n : v < 0 ? err('negative') : ok(v); },
    b(v) { const n = int.b(v); return !n.$ ? n : v < 0 ? err('negative') : ok(v); }
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

export function opt<Type>(t: JsonType<Type>): JsonType<Type | void> {
    return alt(t, und);
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

export function parse<Type>(parser: JsonType<Type>, str: string): JsonResult<Type> {
    let json: any;
    try {
        json = JSON.parse(str);
    } catch (e) {
        return err(e.message);
    }
    return parser.p(json);
}

// The trick with ActualType type parameter makes passed arguments to be the same as route expects.
// Without it the compiler leads the type of the route to the type of arguments.
// Also it is important the arguments must be of the type 'ActualType & Type', because we cannot set type condition 'ActualType = Type'.
export function build<Type, ActualType extends Type>(builder: JsonType<Type>, data: ActualType & Type): JsonResult<string> {
    const res = builder.b(data);
    if (!res.$) return res;
    try {
        return ok(JSON.stringify(res._));
    } catch (e) {
        return err(e.message);
    }
}
