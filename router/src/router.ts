import { Option, some, none } from 'literium-base';

export interface Route<Args> {
    // match path to arguments
    m(s: string): [Args, string] | void;
    // format path with arguments
    f(v: Args): string | void;
}

export interface ArgType<Type> {
    // match regexp
    r: RegExp;
    // parse argument value
    p(s: string | void): Option<Type>;
    // build argument value
    b(v: Type): string | void;
}

export type Routes<State> = { [Id in keyof State]: Route<State[Id]> };

const un_def = undefined;

function is_def<Type>(v: Type | void | null): v is Type {
    return v != un_def;
}

export function match<Args>({ m }: Route<Args>, path: string): Args | void {
    const r = m(path);
    if (!r || r[1] != '') return;
    return r[0];
}

// The trick with ActualArgs type parameter makes passed arguments to be the same as route expects.
// Without it the compiler leads the type of the route to the type of arguments.
// Also it is important the arguments must be of the type 'ActualArgs & Args', because we cannot set type condition 'ActualArgs = Args'.
export function build<Args, ActualArgs extends Args>({ f }: Route<Args>, args: ActualArgs & Args): string {
    const path = f(args);
    if (!is_def(path)) throw "Cannot build path";
    return path;
}

export function dir(path: string): Route<{}> {
    const ent: string = encodeURI(path);

    return {
        m: path => path.substr(0, ent.length) == ent ?
            [{}, path.substr(ent.length)] : un_def,
        f: () => ent
    };
}

export function ins<Arg>(arg: Arg): Route<Arg> {
    return {
        m: path => [arg, path],
        f: args => {
            for (const key in arg) {
                if (!(key in args) || args[key] !== arg[key]) return;
            }
            return '';
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
        m: path => {
            const res = r.exec(path);
            if (!is_def(res)) return;
            const val = p(res[0]);
            if (!val.$) return;
            return [
                { [key as keyof TypeMap]: val._ } as any as TypeMap,
                path.slice(res[0].length)
            ];
        },
        f: args => {
            if (!(key in args)) return;
            return b(args[key as keyof TypeMap]);
        }
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
            if (qmark && path.charAt(0) != '?') return;
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
                        return;
                }
                const val = p(str);
                if (!val.$) return;
                if (is_def(val._)) args[key] = val._;
            }
            return [args, ''];
        },
        f: args => {
            const qargs = {} as QueryArgs;
            for (const key in arg) {
                if (!(key in args)) return;
                const { b } = arg[key];
                const val = b(args[key]);
                if (is_def(val)) qargs[key] = val;
            }
            const qstr = query_build(qargs);
            return `${qmark && qstr ? '?' : ''}${qstr}`;
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
        m: path => {
            for (let i = 0; i < xs.length; i++) {
                const res = (xs as Route<object>[])[i].m(path);
                if (is_def(res)) return res;
            }
        },
        f: args => {
            for (let i = 0; i < xs.length; i++) {
                const path = (xs as Route<object>[])[i].f(args);
                if (is_def(path)) return path;
            }
        }
    } : {
            r: new RegExp((xs as ArgType<any>[]).map(({ r }: ArgType<any>) => unwrapRe(r).source).join('|')),
            p: v => {
                for (let i = 0; i < xs.length; i++) {
                    if (is_def(v)) {
                        const m = (xs as ArgType<any>[])[i].r.exec(v);
                        if (!is_def(m)) continue;
                    }
                    const r = (xs as ArgType<any>[])[i].p(v);
                    if (r.$) return r;
                }
                return none();
            },
            b: v => {
                for (let i = 0; i < xs.length; i++) {
                    const r = (xs as ArgType<any>[])[i].b(v);
                    if (is_def(r)) return r;
                }
            }
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
                if (!is_def(res)) return;
                args = { ...args, ...res[0] };
                path = res[1];
            }
            return [args, path];
        },
        f: args => {
            let path = '';
            for (let i = 0; i < rs.length; i++) {
                const part = rs[i].f(args);
                if (!is_def(part)) return;
                path += part;
            }
            return path;
        }
    };
}

// Router

export function matchs<State>(routes: Routes<State>, path: string): Partial<State> | void {
    let state: Partial<State> | void;
    for (const id in routes) {
        const args = match(routes[id], path);
        if (args) {
            if (!state) state = {} as State;
            state[id] = args;
        }
    }
    return state;
}

export function builds<State>(routes: Routes<State>, state: Partial<State>): string | void {
    for (const id in state) {
        const args = state[id];
        if (is_def(args)) {
            return build(routes[id], args as State[Extract<keyof State, string>]);
        }
    }
}

// Basic types

export const str: ArgType<string> = {
    r: /^[^\/\?]+/,
    p: v => is_def(v) ? some(decodeURIComponent(v)) : none(),
    b: v => typeof v == 'string' ? encodeURIComponent(v) : un_def,
};

export const num: ArgType<number> = {
    r: /^\-?\d+(?:\.\d+)?/,
    p: v => is_def(v) ? some(parseFloat(v)) : none(),
    b: v => typeof v ? `${arg}` : un_def,
};

export const und: ArgType<void> = {
    r: /^/,
    p: () => some(un_def),
    b: () => ''
};

// Numeric types

function is_int(arg: any): boolean {
    return typeof arg == 'number' && isFinite(arg) && !(arg % 1);
}

export const int: ArgType<number> = {
    r: /^\-?\d+/,
    p: v => is_def(v) ? some(parseInt(v)) : none(),
    b: v => is_int(v) ? `${v}` : un_def
};

export const nat: ArgType<number> = {
    r: /^\d+/,
    p: v => is_def(v) ? some(parseInt(v)) : none(),
    b: v => is_int(v) && v >= 0 ? `${v}` : un_def
};

// Type modifiers

export function opt<Type>({ r, p, b }: ArgType<Type>): ArgType<Type | void> {
    return {
        r,
        p: v => is_def(v) ? p(v) : some(un_def),
        b: v => is_def(v) ? b(v) : un_def,
    };
}

export function def<Type>({ r, p, b }: ArgType<Type>, d: Type): ArgType<Type> {
    return {
        r,
        p: v => is_def(v) ? p(v) : some(d),
        b: v => v !== d ? b(v) : un_def,
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
