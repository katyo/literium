import {
    Option,
    some, none,
    is_some, un_some,
    then_some, or_none,
    seek_some, filter_some,
    some_if, none_is,
    map_some, some_type,
    some_def, seek_some_rec,

    mk_seq, do_seq,
    tuple, any_to_str,

    Paired, Keyed, PairedAsKeyed,
    paired_to_keyed, keyed_to_paired
} from '@literium/base';

export interface Route<Args> {
    // match path to arguments
    m(s: string): Option<[Args, string]>;
    // format path with arguments
    f(v: Args): Option<string>;
}

export type RouteArgs<R> = R extends Route<infer Args> ? Args : never;

export interface ArgType<Type> {
    // match regexp
    r: RegExp;
    // parse argument value
    p(s: Option<string>): Option<Type>;
    // build argument value
    b(v: Type): Option<string>;
}

export type Routes<State> = { [Key in keyof State]: Route<State[Key]> };

export type KeyedRoutesArgs<Router> = { [Key in keyof Router]: Keyed<Key, RouteArgs<Router[Key]>> }[keyof Router];

const un_def = undefined;

function is_def<Type>(v: Type | void | null): v is Type {
    return v != un_def;
}

export function match<Args>(route: Route<Args>): (path: string) => Option<Args> {
    return mk_seq(
        route.m,
        then_some(([args, rest]) => rest == '' ? some(args) : none())
    );
}

export function build<Args>(route: Route<Args>): (args: Args) => Option<string> {
    return route.f;
}

export function dir(path: string): Route<{}> {
    const ent: string = encodeURI(path);

    return {
        m: path => path.substr(0, ent.length) == ent ?
            some(tuple({}, path.substr(ent.length))) : none(),
        f: () => some(ent)
    };
}

export function ins<Arg>(arg: Arg): Route<Arg> {
    return {
        m: path => some(tuple(arg, path)),
        f: args => {
            for (const key in arg) {
                if (!(key in args) || args[key] !== arg[key]) return none();
            }
            return some('');
        }
    };
}

export type ArgMap<TypeMap> = { [Tag in keyof TypeMap]: ArgType<TypeMap[Tag]> };

export function arg<TypeMap>(arg: ArgMap<TypeMap>): Route<TypeMap> {
    let key: keyof TypeMap | void;
    for (const fld in arg) {
        key = fld;
        break;
    }
    if (!key) throw "No arg";
    const { r, p, b } = arg[key];

    return {
        m: path => do_seq(
            r.exec(path),
            some_def,
            then_some(([v,]) => do_seq(
                p(some(v)),
                map_some(val => tuple({ [key as keyof TypeMap]: val } as any as TypeMap, path.slice(v.length)))
            ))
        ),
        f: args => key in args ? b(args[key as keyof TypeMap]) : none()
    };
}

export type QueryArgs = Record<string, string | void>;

export function query_parse(str: string): QueryArgs {
    const args = {} as QueryArgs;
    if (str == '') return args;
    for (const arg of str.split(/&/)) {
        const pair = arg.split(/=/);
        args[decodeURIComponent(pair[0])] = pair.length > 1 ? pair[1] : un_def;
    }
    return args;
}

export function query_build(args: QueryArgs): string {
    const strs: string[] = [];
    for (const name in args) {
        const value = args[name];
        strs.push(`${encodeURIComponent(name)}${typeof value == 'string' ? `=${value}` : ''}`);
    }
    return strs.join('&');
}

export function query<TypeMap>(arg: ArgMap<TypeMap>, qmark: boolean = true): Route<TypeMap> {
    let key: keyof TypeMap | void;
    for (const fld in arg) {
        key = fld;
        break;
    }
    if (!key) throw "No args";

    return {
        m: path => {
            if (qmark && path.charAt(0) != '?') return none();
            const qargs = query_parse(qmark ? path.substring(1) : path);
            const args = {} as TypeMap;
            for (const key in arg) {
                const { r, p } = arg[key];
                const str = qargs[key as string];
                if (is_def(str)) {
                    // check string value using regexp
                    const res_ = r.exec(str);
                    if (!is_def(res_) ||
                        res_[0].length != str.length)
                        return none();
                }
                const val = p(some_def(str));
                if (!is_some(val)) return none();
                if (is_def(val._)) args[key] = val._;
            }
            return some(tuple(args, ''));
        },
        f: args => {
            const qargs = {} as QueryArgs;
            for (const key in arg) {
                if (!(key in args)) return none();
                const { b } = arg[key];
                const val = b(args[key]);
                if (is_some(val)) qargs[key] = un_some(val);
            }
            const qstr = query_build(qargs);
            return some(`${qmark && qstr ? '?' : ''}${qstr}`);
        }
    };
}

// Combinators

export function alt<Args1, Args2>(r1: Route<Args1>, r2: Route<Args2>): Route<Args1 | Args2>;
export function alt<Args1, Args2, Args3>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>): Route<Args1 | Args2 | Args3>;
export function alt<Args1, Args2, Args3, Args4>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>): Route<Args1 | Args2 | Args3 | Args4>;
export function alt<Args1, Args2, Args3, Args4, Args5>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>): Route<Args1 | Args2 | Args3 | Args4 | Args5>;
export function alt<Args1, Args2, Args3, Args4, Args5, Args6>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6>;
export function alt<Args1, Args2, Args3, Args4, Args5, Args6, Args7>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6 | Args7>;
export function alt<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6 | Args7 | Args8>;
export function alt<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6 | Args7 | Args8 | Args9>;
export function alt<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6 | Args7 | Args8 | Args9>;

export function alt<Type1, Type2>(t1: ArgType<Type1>, t2: ArgType<Type2>): ArgType<Type1 | Type2>;
export function alt<Type1, Type2, Type3>(t1: ArgType<Type1>, t2: ArgType<Type2>, t3: ArgType<Type3>): ArgType<Type1 | Type2 | Type3>;
export function alt<Type1, Type2, Type3, Type4>(t1: ArgType<Type1>, t2: ArgType<Type2>, t3: ArgType<Type3>, t4: ArgType<Type4>): ArgType<Type1 | Type2 | Type3 | Type4>;
export function alt<Type1, Type2, Type3, Type4, Type5>(t1: ArgType<Type1>, t2: ArgType<Type2>, t3: ArgType<Type3>, t4: ArgType<Type4>, t5: ArgType<Type5>): ArgType<Type1 | Type2 | Type3 | Type4 | Type5>;
export function alt<Type1, Type2, Type3, Type4, Type5, Type6>(t1: ArgType<Type1>, t2: ArgType<Type2>, t3: ArgType<Type3>, t4: ArgType<Type4>, t5: ArgType<Type5>, t6: ArgType<Type6>): ArgType<Type1 | Type2 | Type3 | Type4 | Type5 | Type6>;
export function alt<Type1, Type2, Type3, Type4, Type5, Type6, Type7>(t1: ArgType<Type1>, t2: ArgType<Type2>, t3: ArgType<Type3>, t4: ArgType<Type4>, t5: ArgType<Type5>, t6: ArgType<Type6>, t7: ArgType<Type7>): ArgType<Type1 | Type2 | Type3 | Type4 | Type5 | Type6 | Type7>;
export function alt<Type1, Type2, Type3, Type4, Type5, Type6, Type7, Type8>(t1: ArgType<Type1>, t2: ArgType<Type2>, t3: ArgType<Type3>, t4: ArgType<Type4>, t5: ArgType<Type5>, t6: ArgType<Type6>, t7: ArgType<Type7>, t8: ArgType<Type8>): ArgType<Type1 | Type2 | Type3 | Type4 | Type5 | Type6 | Type7 | Type8>;
export function alt<Type1, Type2, Type3, Type4, Type5, Type6, Type7, Type8, Type9>(t1: ArgType<Type1>, t2: ArgType<Type2>, t3: ArgType<Type3>, t4: ArgType<Type4>, t5: ArgType<Type5>, t6: ArgType<Type6>, t7: ArgType<Type7>, t8: ArgType<Type8>, t9: ArgType<Type9>): ArgType<Type1 | Type2 | Type3 | Type4 | Type5 | Type6 | Type7 | Type8 | Type9>;
export function alt<Type1, Type2, Type3, Type4, Type5, Type6, Type7, Type8, Type9>(t1: ArgType<Type1>, t2: ArgType<Type2>, t3: ArgType<Type3>, t4: ArgType<Type4>, t5: ArgType<Type5>, t6: ArgType<Type6>, t7: ArgType<Type7>, t8: ArgType<Type8>, t9: ArgType<Type9>): ArgType<Type1 | Type2 | Type3 | Type4 | Type5 | Type6 | Type7 | Type8 | Type9>;

export function alt(...xs: (Route<object> | ArgType<any>)[]): Route<object> | ArgType<any> {
    return (xs as Route<object>[])[0].m ? {
        m: path => seek_some((r: Route<object>) => r.m(path))(xs as Route<object>[]),
        f: args => seek_some((r: Route<object>) => r.f(args))(xs as Route<object>[])
    } : {
            r: new RegExp((xs as ArgType<any>[]).map(({ r }: ArgType<any>) => unwrapRe(r).source).join('|')),
            p: then_some(v => seek_some((a: ArgType<any>) => do_seq(
                a.r.exec(v),
                some_def,
                map_some(([a,]) => a),
                a.p
            ))(xs as ArgType<any>[])),
            b: v => seek_some((a: ArgType<any>) => a.b(v))(xs as ArgType<any>[])
        };
}

export function seq<Args1, Args2>(r1: Route<Args1>, r2: Route<Args2>): Route<Args1 & Args2>;
export function seq<Args1, Args2, Args3>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>): Route<Args1 & Args2 & Args3>;
export function seq<Args1, Args2, Args3, Args4>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>): Route<Args1 & Args2 & Args3 & Args4>;
export function seq<Args1, Args2, Args3, Args4, Args5>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>): Route<Args1 & Args2 & Args3 & Args4 & Args5>;
export function seq<Args1, Args2, Args3, Args4, Args5, Args6>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6>;
export function seq<Args1, Args2, Args3, Args4, Args5, Args6, Args7>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7>;
export function seq<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8>;
export function seq<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9>;
export function seq<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9>;
export function seq<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9, Args10>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>, r10: Route<Args10>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9 & Args10>;
export function seq<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9, Args10, Args11>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>, r10: Route<Args10>, r11: Route<Args11>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9 & Args10 & Args11>;
export function seq<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9, Args10, Args11, Args12>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>, r10: Route<Args10>, r11: Route<Args11>, r12: Route<Args12>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9 & Args10 & Args11 & Args12>;
export function seq<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9, Args10, Args11, Args12, Args13>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>, r10: Route<Args10>, r11: Route<Args11>, r12: Route<Args12>, r13: Route<Args13>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9 & Args10 & Args11 & Args12 & Args13>;
export function seq<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9, Args10, Args11, Args12, Args13, Args14>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>, r10: Route<Args10>, r11: Route<Args11>, r12: Route<Args12>, r13: Route<Args13>, r14: Route<Args14>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9 & Args10 & Args11 & Args12 & Args13 & Args14>;
export function seq<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9, Args10, Args11, Args12, Args13, Args14, Args15>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>, r10: Route<Args10>, r11: Route<Args11>, r12: Route<Args12>, r13: Route<Args13>, r14: Route<Args14>, r15: Route<Args15>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9 & Args10 & Args11 & Args12 & Args13 & Args14 & Args15>;
export function seq<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9, Args10, Args11, Args12, Args13, Args14, Args15, Args16>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>, r10: Route<Args10>, r11: Route<Args11>, r12: Route<Args12>, r13: Route<Args13>, r14: Route<Args14>, r15: Route<Args15>, r16: Route<Args16>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9 & Args10 & Args11 & Args12 & Args13 & Args14 & Args15 & Args16>;
export function seq(...rs: Route<object>[]): Route<object> {
    return {
        m: path => {
            let args = {};
            for (let i = 0; i < rs.length; i++) {
                const res = rs[i].m(path);
                if (!is_some(res)) return none();
                const [args_, path_] = un_some(res);
                args = { ...args, ...args_ };
                path = path_;
            }
            return some(tuple(args, path));
        },
        f: args => {
            let path = '';
            for (let i = 0; i < rs.length; i++) {
                const part = rs[i].f(args);
                if (!is_some(part)) return none();
                path += un_some(part);
            }
            return some(path);
        }
    };
}

// Router

export function match_paired<State>(routes: Routes<State>): (path: string) => Option<Paired<State>> {
    return (path: string) => {
        let state: Paired<State> | void;
        for (const id in routes) {
            const args = match(routes[id])(path);
            if (is_some(args)) {
                if (!state) state = {} as Paired<State>;
                state[id] = un_some(args);
            }
        }
        return some_def(state);
    };
}

export function build_paired<State>(routes: Routes<State>): (state: Paired<State>) => Option<string> {
    return seek_some_rec<Paired<State>, string>((args, id) =>
        args ? build(routes[id])(args as State[keyof State]) : none());
}

export function match_keyed<State>(routes: Routes<State>): (path: string) => Option<PairedAsKeyed<State>> {
    return mk_seq(
        match_paired(routes),
        map_some(paired_to_keyed)
    );
}

export function build_keyed<State>(routes: Routes<State>): (state: PairedAsKeyed<State>) => Option<string> {
    return mk_seq(
        keyed_to_paired,
        build_paired(routes)
    );
}

// Basic types

export const str: ArgType<string> = {
    r: /^[^\/\?]+/,
    p: /*@__PURE__*/map_some(decodeURIComponent),
    b: /*@__PURE__*/mk_seq(some_type('string'), map_some(encodeURIComponent)),
};

const some_if_num = /*@__PURE__*/some_type('number');
const filter_if_fin = /*@__PURE__*/then_some(some_if(isFinite));
const map_to_str = /*@__PURE__*/map_some(any_to_str);

export const num: ArgType<number> = {
    r: /^\-?\d+(?:\.\d+)?/,
    p: /*@__PURE__*/mk_seq(map_some(parseFloat), filter_if_fin),
    b: /*@__PURE__*/mk_seq(some_if_num, filter_if_fin, map_to_str),
};

export const und: ArgType<void> = {
    r: /^/,
    p: () => some(un_def),
    b: () => some('')
};

// Numeric types

const map_parse_int = map_some(parseInt);
const filter_if_int = filter_some((_: number) => !(_ % 1));

export const int: ArgType<number> = {
    r: /^\-?\d+/,
    p: /*@__PURE__*/mk_seq(map_parse_int, filter_if_fin, filter_if_int),
    b: /*@__PURE__*/mk_seq(some_if_num, filter_if_fin, filter_if_int, map_to_str)
};

const filter_if_pos = filter_some((_: number) => _ >= 0);

export const nat: ArgType<number> = {
    r: /^\d+/,
    p: /*@__PURE__*/mk_seq(map_parse_int, filter_if_fin, filter_if_int, filter_if_pos),
    b: /*@__PURE__*/mk_seq(some_if_num, filter_if_fin, filter_if_int, filter_if_pos, map_to_str)
};

// Type modifiers

export function opt<Type>({ r, p, b }: ArgType<Type>): ArgType<Type | void> {
    return {
        r,
        p: mk_seq(p as (_: Option<string>) => Option<Type | void>, or_none(un_def)),
        b: mk_seq(some_def, then_some(b))
    };
}

export function def<Type>({ r, p, b }: ArgType<Type>, d: Type): ArgType<Type> {
    return {
        r,
        p: mk_seq(p, or_none(d)),
        b: mk_seq(none_is(d), then_some(b)),
    };
}

interface RegExpData {
    source: string,
    flags: string,
}

const unwrapRe: (regexp: RegExp) => RegExpData = 'flags' in RegExp.prototype ?
    (regexp: RegExp) => regexp : (regexp: RegExp) => {
        const strexp = regexp.toString();
        const flags = (/[gimuy]*$/.exec(strexp) as RegExpExecArray)[0];
        const source = strexp.substring(1, strexp.length - 1 - flags.length);
        return { source, flags };
    };
