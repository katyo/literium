export interface JSTypeMap {
    'string': string;
    'number': number;
    'boolean': boolean;
    'undefined': undefined;
    'function': Function;
    'object': object;
}

export type JSTypeName<Type> =
    Type extends string ? 'string' :
    Type extends number ? 'number' :
    Type extends boolean ? 'boolean' :
    Type extends undefined ? 'undefined' :
    Type extends Function ? 'function' :
    'object';

export function identity<V>(_: V): V { return _; }

export function constant<V>(_: V): () => V {
    return () => _;
}

export function dummy(): void { }

export function tuple<V1>(v1: V1): [V1];
export function tuple<V1, V2>(v1: V1, v2: V2): [V1, V2];
export function tuple<V1, V2, V3>(v1: V1, v2: V2, v3: V3): [V1, V2, V3];
export function tuple<V1, V2, V3, V4>(v1: V1, v2: V2, v3: V3, v4: V4): [V1, V2, V3, V4];
export function tuple<V1, V2, V3, V4, V5>(v1: V1, v2: V2, v3: V3, v4: V4, v5: V5): [V1, V2, V3, V4, V5];
export function tuple<V1, V2, V3, V4, V5, V6>(v1: V1, v2: V2, v3: V3, v4: V4, v5: V5, v6: V6): [V1, V2, V3, V4, V5, V6];
export function tuple<V1, V2, V3, V4, V5, V6, V7>(v1: V1, v2: V2, v3: V3, v4: V4, v5: V5, v6: V6, v7: V7): [V1, V2, V3, V4, V5, V6, V7];
export function tuple<V1, V2, V3, V4, V5, V6, V7, V8>(v1: V1, v2: V2, v3: V3, v4: V4, v5: V5, v6: V6, v7: V7, v8: V8): [V1, V2, V3, V4, V5, V6, V7, V8];
export function tuple<V1, V2, V3, V4, V5, V6, V7, V8, V9>(v1: V1, v2: V2, v3: V3, v4: V4, v5: V5, v6: V6, v7: V7, v8: V8, v9: V9): [V1, V2, V3, V4, V5, V6, V7, V8, V9];
export function tuple(...vs: any[]): any[] {
    return vs;
}

export function mk_seq<T1>(): (_: T1) => T1;
export function mk_seq<T1, T2>(f1: (_: T1) => T2): (_: T1) => T2;
export function mk_seq<T1, T2, T3>(f1: (_: T1) => T2, f2: (_: T2) => T3): (_: T1) => T3;
export function mk_seq<T1, T2, T3, T4>(f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4): (_: T1) => T4;
export function mk_seq<T1, T2, T3, T4, T5>(f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5): (_: T1) => T5;
export function mk_seq<T1, T2, T3, T4, T5, T6>(f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6): (_: T1) => T6;
export function mk_seq<T1, T2, T3, T4, T5, T6, T7>(f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6, f6: (_: T6) => T7): (_: T1) => T7;
export function mk_seq<T1, T2, T3, T4, T5, T6, T7, T8>(f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6, f6: (_: T6) => T7, f7: (_: T7) => T8): (_: T1) => T8;
export function mk_seq<T1, T2, T3, T4, T5, T6, T7, T8, T9>(f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6, f6: (_: T6) => T7, f7: (_: T7) => T8, f8: (_: T8) => T9): (_: T1) => T9;
export function mk_seq<S>(...fs: ((_: any) => any)[]): (_: any) => any {
    return _ => {
        for (const f of fs) {
            _ = f(_);
        }
        return _;
    };
}

export function do_seq<T1>(_: T1): T1;
export function do_seq<T1, T2>(_: T1, f1: (_: T1) => T2): T2;
export function do_seq<T1, T2, T3>(_: T1, f1: (_: T1) => T2, f2: (_: T2) => T3): T3;
export function do_seq<T1, T2, T3, T4>(_: T1, f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4): T4;
export function do_seq<T1, T2, T3, T4, T5>(_: T1, f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5): T5;
export function do_seq<T1, T2, T3, T4, T5, T6>(_: T1, f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6): T6;
export function do_seq<T1, T2, T3, T4, T5, T6, T7>(_: T1, f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6, f6: (_: T6) => T7): T7;
export function do_seq<T1, T2, T3, T4, T5, T6, T7, T8>(_: T1, f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6, f6: (_: T6) => T7, f7: (_: T7) => T8): T8;
export function do_seq<T1, T2, T3, T4, T5, T6, T7, T8, T9>(_: T1, f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6, f6: (_: T6) => T7, f7: (_: T7) => T8, f8: (_: T8) => T9): T9;
export function do_seq<S>(_: any, ...fs: ((_: any) => any)[]): any {
    return mk_seq.apply(undefined, fs)(_);
}

export function deferred(fn: () => void): () => () => void;
export function deferred<T1>(fn: (a1: T1) => void): (a1: T1) => () => void;
export function deferred<T1, T2>(fn: (a1: T1, a2: T2) => void): (a1: T1, a2: T2) => () => void;
export function deferred<T1, T2, T3>(fn: (a1: T1, a2: T2, a3: T3) => void): (a1: T1, a2: T2, a3: T3) => () => void;
export function deferred<T1, T2, T3, T4>(fn: (a1: T1, a2: T2, a3: T3, a4: T4) => void): (a1: T1, a2: T2, a3: T3, a4: T4) => () => void;
export function deferred<T1, T2, T3, T4, T5>(fn: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5) => void): (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5) => () => void;
export function deferred<T1, T2, T3, T4, T5, T6>(fn: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6) => void): (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6) => () => void;
export function deferred<T1, T2, T3, T4, T5, T6, T7>(fn: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7) => void): (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7) => () => void;
export function deferred<T1, T2, T3, T4, T5, T6, T7, T8>(fn: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8) => void): (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8) => () => void;
export function deferred<T1, T2, T3, T4, T5, T6, T7, T8, T9>(fn: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8, a9: T9) => void): (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8, a9: T9) => () => void;
export function deferred(fn: (...args: any[]) => void): (...args: any[]) => () => void {
    return function(...args: any[]) {
        const timer = setImmediate(() => {
            fn(...args);
        });
        return () => {
            clearImmediate(timer);
        };
    };
}

export function bind_method<T, N extends keyof T, F extends T[N] & Function>(self: T, name: N): T[N] {
    return (self[name] as F).bind(self);
}

export function flat_map<Arg, Res>(fn: (arg: Arg, idx: number) => Res | Res[]): (list: (Arg | Arg[])[]) => Res[] {
    return (list: (Arg | Arg[])[]) => {
        const res: Res[] = [];
        let n = 0;
        for (let i = 0; i < list.length; i++) op(list[i]);
        return res;

        function op(item: Arg | Arg[]) {
            if (Array.isArray(item)) {
                for (const sub of item) op(sub);
            } else {
                const val = fn(item, n++);
                if (Array.isArray(val)) {
                    for (const elm of val) {
                        res.push(elm);
                    }
                } else {
                    res.push(val);
                }
            }
        }
    };
}

export const flat_list: <Type>(list: (Type | Type[])[]) => Type[] = flat_map(identity);

export function flat_all<Type>(...args: (Type | Type[])[]): Type[] {
    return flat_list(args);
}

export function any_to_str<Value>(value: Value): string {
    return `${value}`;
}

export function err_to_str(error: Error): string {
    return error.message;
}

export function str_to_err(message: string): Error {
    return new Error(message);
}
