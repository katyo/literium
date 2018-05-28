// satisfy existing argument type
export interface PathArg<TypeMap> { [name: string]: keyof TypeMap }

// map argument type
export type ArgMap<TypeMap, Arg extends PathArg<TypeMap>> = { [Name in keyof Arg]: TypeMap[Arg[Name]] };

export interface TypeImpl<Type> {
    parse(path: string): [Type, string] | void;
    build(arg: Type): string | void;
}

export type TypeApi<TypeMap> = { [Tag in keyof TypeMap]: TypeImpl<TypeMap[Tag]> };

export interface Route<Args> {
    // match path to arguments
    parse(path: string): [Args, string] | void;
    // build path from arguments
    build(args: Args): string | void;
}

export type Routes<State> = { [Id in keyof State]: Route<State[Id]> };

export function route_match<Args>(route: Route<Args>, path: string): Args | void {
    const res = route.parse(path);
    if (!res || res[1] != '') return;
    return res[0];
}

// The trick with ActualArgs type parameter makes passed arguments to be the same as route expects.
// Without it the compiler leads the type of the route to the type of arguments.
// Also it is important the arguments must be of the type 'ActualArgs & Args', because we cannot set type condition 'ActualArgs = Args'.
export function route_build<Args, ActualArgs extends Args>(route: Route<Args>, args: ActualArgs & Args): string {
    const path = route.build(args);
    if (path === undefined) throw "Cannot build path";
    return path;
}

export function route_str(path: string): Route<{}> {
    const ent: string = encodeURI(path);

    return {
        parse: path => path.substr(0, ent.length) == ent ?
            [{}, path.substr(ent.length)] : undefined,
        build: () => ent
    };
}

export function route_def<Arg>(arg: Arg): Route<Arg> {
    return {
        parse: path => [arg, path],
        build: args => {
            for (const key in arg) {
                if (!(key in args) || args[key] !== arg[key]) return;
            }
            return '';
        }
    };
}

export function route_arg<TypeMap, Arg extends PathArg<TypeMap>>(arg: Arg, type_api: TypeApi<TypeMap>): Route<ArgMap<TypeMap, Arg>> {
    let key: keyof Arg | void;
    let api: TypeImpl<TypeMap[keyof TypeMap]>;
    for (const fld in arg) {
        key = fld;
        api = type_api[arg[key]];
        break;
    }
    if (!key) throw "No arg";

    return {
        parse: path => {
            const res = api.parse(path);
            if (!res) return;
            const [val, rest] = res;
            return [{ [key as keyof Arg]: val } as ArgMap<TypeMap, Arg>, rest];
        },
        build: args => {
            if (!(key in args)) return;
            return api.build(args[key as keyof Arg]);
        }
    };
}

export function route_or<Args1, Args2>(r1: Route<Args1>, r2: Route<Args2>): Route<Args1 | Args2>;
export function route_or<Args1, Args2, Args3>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>): Route<Args1 | Args2 | Args3>;
export function route_or<Args1, Args2, Args3, Args4>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>): Route<Args1 | Args2 | Args3 | Args4>;
export function route_or<Args1, Args2, Args3, Args4, Args5>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>): Route<Args1 | Args2 | Args3 | Args4 | Args5>;
export function route_or<Args1, Args2, Args3, Args4, Args5, Args6>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6>;
export function route_or<Args1, Args2, Args3, Args4, Args5, Args6, Args7>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6 | Args7>;
export function route_or<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6 | Args7 | Args8>;
export function route_or<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6 | Args7 | Args8 | Args9>;
export function route_or<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>): Route<Args1 | Args2 | Args3 | Args4 | Args5 | Args6 | Args7 | Args8 | Args9>;
export function route_or(...rs: Route<object>[]): Route<object> {
    return {
        parse: path => {
            for (let i = 0; i < rs.length; i++) {
                const res = rs[i].parse(path);
                if (res !== undefined) return res;
            }
        },
        build: args => {
            for (let i = 0; i < rs.length; i++) {
                const path = rs[i].build(args);
                if (path !== undefined) return path;
            }
        }
    };
}

export function route_and<Args1, Args2>(r1: Route<Args1>, r2: Route<Args2>): Route<Args1 & Args2>;
export function route_and<Args1, Args2, Args3>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>): Route<Args1 & Args2 & Args3>;
export function route_and<Args1, Args2, Args3, Args4>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>): Route<Args1 & Args2 & Args3 & Args4>;
export function route_and<Args1, Args2, Args3, Args4, Args5>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>): Route<Args1 & Args2 & Args3 & Args4 & Args5>;
export function route_and<Args1, Args2, Args3, Args4, Args5, Args6>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6>;
export function route_and<Args1, Args2, Args3, Args4, Args5, Args6, Args7>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7>;
export function route_and<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8>;
export function route_and<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9>;
export function route_and<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9>;
export function route_and<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9, Args10>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>, r10: Route<Args10>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9 & Args10>;
export function route_and<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9, Args10, Args11>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>, r10: Route<Args10>, r11: Route<Args11>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9 & Args10 & Args11>;
export function route_and<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9, Args10, Args11, Args12>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>, r10: Route<Args10>, r11: Route<Args11>, r12: Route<Args12>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9 & Args10 & Args11 & Args12>;
export function route_and<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9, Args10, Args11, Args12, Args13>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>, r10: Route<Args10>, r11: Route<Args11>, r12: Route<Args12>, r13: Route<Args13>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9 & Args10 & Args11 & Args12 & Args13>;
export function route_and<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9, Args10, Args11, Args12, Args13, Args14>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>, r10: Route<Args10>, r11: Route<Args11>, r12: Route<Args12>, r13: Route<Args13>, r14: Route<Args14>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9 & Args10 & Args11 & Args12 & Args13 & Args14>;
export function route_and<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9, Args10, Args11, Args12, Args13, Args14, Args15>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>, r10: Route<Args10>, r11: Route<Args11>, r12: Route<Args12>, r13: Route<Args13>, r14: Route<Args14>, r15: Route<Args15>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9 & Args10 & Args11 & Args12 & Args13 & Args14 & Args15>;
export function route_and<Args1, Args2, Args3, Args4, Args5, Args6, Args7, Args8, Args9, Args10, Args11, Args12, Args13, Args14, Args15, Args16>(r1: Route<Args1>, r2: Route<Args2>, r3: Route<Args3>, r4: Route<Args4>, r5: Route<Args5>, r6: Route<Args6>, r7: Route<Args7>, r8: Route<Args8>, r9: Route<Args9>, r10: Route<Args10>, r11: Route<Args11>, r12: Route<Args12>, r13: Route<Args13>, r14: Route<Args14>, r15: Route<Args15>, r16: Route<Args16>): Route<Args1 & Args2 & Args3 & Args4 & Args5 & Args6 & Args7 & Args8 & Args9 & Args10 & Args11 & Args12 & Args13 & Args14 & Args15 & Args16>;
export function route_and(...rs: Route<object>[]): Route<object> {
    return {
        parse: path => {
            let args = {};
            for (let i = 0; i < rs.length; i++) {
                const res = rs[i].parse(path);
                if (res === undefined) return;
                args = { ...args, ...res[0] };
                path = res[1];
            }
            return [args, path];
        },
        build: args => {
            let path = '';
            for (let i = 0; i < rs.length; i++) {
                const part = rs[i].build(args);
                if (part === undefined) return;
                path += part;
            }
            return path;
        }
    };
}

export function router_match<State>(routes: Routes<State>, path: string): Partial<State> | void {
    let state: Partial<State> | void;
    for (const id in routes) {
        const args = route_match(routes[id], path);
        if (args) {
            if (!state) state = {} as State;
            state[id] = args;
        }
    }
    return state;
}

export function router_build<State>(routes: Routes<State>, state: Partial<State>): string | void {
    for (const id in state) {
        const args = state[id];
        if (args !== undefined) {
            return route_build(routes[id], args as State[keyof State]);
        }
    }
}

export function type_mix<Api1, Api2>(api1: TypeApi<Api1>, api2: TypeApi<Api2>): TypeApi<Api1 & Api2>;
export function type_mix<Api1, Api2, Api3>(api1: TypeApi<Api1>, api2: TypeApi<Api2>, api3: TypeApi<Api3>): TypeApi<Api1 & Api2 & Api3>;
export function type_mix<Api1, Api2, Api3, Api4>(api1: TypeApi<Api1>, api2: TypeApi<Api2>, api3: TypeApi<Api3>, api4: TypeApi<Api4>): TypeApi<Api1 & Api2 & Api3 & Api4>;
export function type_mix<Api1, Api2, Api3, Api4, Api5>(api1: TypeApi<Api1>, api2: TypeApi<Api2>, api3: TypeApi<Api3>, api4: TypeApi<Api4>, api5: TypeApi<Api5>): TypeApi<Api1 & Api2 & Api3 & Api4 & Api5>;
export function type_mix<Api1, Api2, Api3, Api4, Api5, Api6>(api1: TypeApi<Api1>, api2: TypeApi<Api2>, api3: TypeApi<Api3>, api4: TypeApi<Api4>, api5: TypeApi<Api5>, api6: TypeApi<Api6>): TypeApi<Api1 & Api2 & Api3 & Api4 & Api5 & Api6>;
export function type_mix<Api1, Api2, Api3, Api4, Api5, Api6, Api7>(api1: TypeApi<Api1>, api2: TypeApi<Api2>, api3: TypeApi<Api3>, api4: TypeApi<Api4>, api5: TypeApi<Api5>, api6: TypeApi<Api6>, api7: TypeApi<Api7>): TypeApi<Api1 & Api2 & Api3 & Api4 & Api5 & Api6 & Api7>;
export function type_mix<Api1, Api2, Api3, Api4, Api5, Api6, Api7, Api8>(api1: TypeApi<Api1>, api2: TypeApi<Api2>, api3: TypeApi<Api3>, api4: TypeApi<Api4>, api5: TypeApi<Api5>, api6: TypeApi<Api6>, api7: TypeApi<Api7>, api8: TypeApi<Api8>): TypeApi<Api1 & Api2 & Api3 & Api4 & Api5 & Api6 & Api7 & Api8>;
export function type_mix(...ts: TypeApi<object>[]): TypeApi<object> {
    let r = {};
    for (const t of ts) r = { ...r, ...t };
    return r;
}

export interface BaseTypes {
    str: string;
    num: number;
}

export const baseTypes: TypeApi<BaseTypes> = {
    str: {
        parse: path => {
            const m = path.match(/^([^\/\?]+)(.*)$/);
            if (m) return [decodeURIComponent(m[1]), m[2]];
        },
        build: arg => typeof arg == 'string' ? encodeURIComponent(arg) : undefined
    },
    num: {
        parse: path => {
            const m = path.match(/^(\-?\d+(?:\.\d+)?)(.*)$/);
            if (m) return [parseFloat(m[1]), m[2]];
        },
        build: arg => typeof arg == 'number' ? `${arg}` : undefined,
    }
};

export interface NumTypes {
    nat: number;
    int: number;
}

function is_int(arg: any): boolean {
    return typeof arg == 'number' && isFinite(arg) && !(arg % 1);
}

export const numTypes: TypeApi<NumTypes> = {
    int: {
        parse: path => {
            const m = path.match(/^(\-?\d+)(.*)$/);
            if (m) return [parseInt(m[1]), m[2]];
        },
        build: arg => is_int(arg) ? `${arg}` : undefined
    },
    nat: {
        parse: path => {
            const m = path.match(/^(\d+)(.*)$/);
            if (m) return [parseInt(m[1]), m[2]];
        },
        build: arg => is_int(arg) && arg >= 0 ? `${arg}` : undefined
    }
};
