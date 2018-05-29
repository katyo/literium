export interface Route<Args> {
    // match path to arguments
    p(path: string): [Args, string] | void;
    // build path from arguments
    b(args: Args): string | void;
}

export type Routes<State> = { [Id in keyof State]: Route<State[Id]> };

export function match<Args>(route: Route<Args>, path: string): Args | void {
    const res = route.p(path);
    if (!res || res[1] != '') return;
    return res[0];
}

// The trick with ActualArgs type parameter makes passed arguments to be the same as route expects.
// Without it the compiler leads the type of the route to the type of arguments.
// Also it is important the arguments must be of the type 'ActualArgs & Args', because we cannot set type condition 'ActualArgs = Args'.
export function build<Args, ActualArgs extends Args>(route: Route<Args>, args: ActualArgs & Args): string {
    const path = route.b(args);
    if (path === undefined) throw "Cannot build path";
    return path;
}

export function dir(path: string): Route<{}> {
    const ent: string = encodeURI(path);

    return {
        p: path => path.substr(0, ent.length) == ent ?
            [{}, path.substr(ent.length)] : undefined,
        b: () => ent
    };
}

export function def<Arg>(arg: Arg): Route<Arg> {
    return {
        p: path => [arg, path],
        b: args => {
            for (const key in arg) {
                if (!(key in args) || args[key] !== arg[key]) return;
            }
            return '';
        }
    };
}

export type ArgMap<TypeMap> = { [Tag in keyof TypeMap]: Route<TypeMap[Tag]> };

export function arg<TypeMap>(arg: ArgMap<TypeMap>): Route<TypeMap> {
    let key: keyof TypeMap | void;
    let api: Route<TypeMap[keyof TypeMap]>;
    for (const fld in arg) {
        key = fld;
        api = arg[key];
        break;
    }
    if (!key) throw "No arg";

    return {
        p: path => {
            const res = api.p(path);
            if (!res) return;
            const [val, rest] = res;
            return [{ [key as keyof TypeMap]: val } as any as TypeMap, rest];
        },
        b: args => {
            if (!(key in args)) return;
            return api.b(args[key as keyof TypeMap]);
        }
    };
}

export type QueryArgs = Record<string, string | void>;

export function query_parse(str: string): QueryArgs {
    const args = {} as QueryArgs;
    for (const arg of str.split(/&/)) {
        const pair = arg.split(/=/);
        args[decodeURIComponent(pair[0])] = pair.length > 1 ? pair[1] : undefined;
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

export function query<TypeMap>(arg: ArgMap<TypeMap>): Route<TypeMap> {
    let key: keyof TypeMap | void;
    for (const fld in arg) {
        key = fld;
        break;
    }
    if (!key) throw "No args";

    return {
        p: path => {
            if (path.charAt(0) != '?') return;
            const qargs = query_parse(path.substring(1));
            const args = {} as TypeMap;
            for (const key in arg) {
                const api = arg[key];
                const val = qargs[key];
                if (typeof val != 'string') return;
                const res = api.p(val);
                if (!res || res[1] != '') return;
                args[key] = res[0];
            }
            return [args, ''];
        },
        b: args => {
            const qargs = {} as QueryArgs;
            for (const key in arg) {
                if (!(key in args)) return;
                const api = arg[key];
                const val = api.b(args[key]);
                if (typeof val != 'string') return;
                qargs[key] = val;
            }
            return `?${query_build(qargs)}`;
        }
    };
}

// Combinators

export function opt<Args>(r: Route<Args>): Route<Args | void> {
    return alt(r, und);
}

export function alt<Args1, Args2>(r1: Route<Args1>, r2: Route<Args2>): Route<Args1 | Args2>;
export function alt<Args1, Args2, Args3>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>): Route<Args1 | Args2 | Args3>;
export function alt<Args1, Args2, Args3, Args4>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>): Route<Args1 | Args2 | Args3 | Args4>;
export function alt<Args1, Args2, Args3, Args4, Args5>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>): Route<Args1 | Args2 | Args3 | Args4 | Args5>;
export function alt<Args1, Args2, Args3, Args4, Args5, Args6>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6>;
export function alt<Args1, Args2, Args3, Args4, Args5, Args6, Args7>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6 | Args7>;
export function alt<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6 | Args7 | Args8>;
export function alt<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6 | Args7 | Args8 | Args9>;
export function alt<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6 | Args7 | Args8 | Args9>;
export function alt(...rs: Route<object>[]): Route<object> {
    return {
        p: path => {
            for (let i = 0; i < rs.length; i++) {
                const res = rs[i].p(path);
                if (res !== undefined) return res;
            }
        },
        b: args => {
            for (let i = 0; i < rs.length; i++) {
                const path = rs[i].b(args);
                if (path !== undefined) return path;
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
        p: path => {
            let args = {};
            for (let i = 0; i < rs.length; i++) {
                const res = rs[i].p(path);
                if (res === undefined) return;
                args = { ...args, ...res[0] };
                path = res[1];
            }
            return [args, path];
        },
        b: args => {
            let path = '';
            for (let i = 0; i < rs.length; i++) {
                const part = rs[i].b(args);
                if (part === undefined) return;
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
        if (args !== undefined) {
            return build(routes[id], args as State[keyof State]);
        }
    }
}

// Basic types

export const str: Route<string> = {
    p: path => {
        const m = path.match(/^([^\/\?]+)(.*)$/);
        if (m) return [decodeURIComponent(m[1]), m[2]];
    },
    b: arg => typeof arg == 'string' ? encodeURIComponent(arg) : undefined
};

export const num: Route<number> = {
    p: path => {
        const m = path.match(/^(\-?\d+(?:\.\d+)?)(.*)$/);
        if (m) return [parseFloat(m[1]), m[2]];
    },
    b: arg => typeof arg == 'number' ? `${arg}` : undefined,
};

export const und: Route<void> = {
    p: path => [undefined, path],
    b: () => ''
};

// Numeric types

function is_int(arg: any): boolean {
    return typeof arg == 'number' && isFinite(arg) && !(arg % 1);
}

export const int: Route<number> = {
    p: path => {
        const m = path.match(/^(\-?\d+)(.*)$/);
        if (m) return [parseInt(m[1]), m[2]];
    },
    b: arg => is_int(arg) ? `${arg}` : undefined
};

export const nat: Route<number> = {
    p: path => {
        const m = path.match(/^(\d+)(.*)$/);
        if (m) return [parseInt(m[1]), m[2]];
    },
    b: arg => is_int(arg) && arg >= 0 ? `${arg}` : undefined
};
