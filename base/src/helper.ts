export const enum JSType {
    String,
    Number,
    Boolean,
    Undefined,
    Function,
    Array,
    Object,
}

export interface JSTypeMap {
    [JSType.String]: string;
    [JSType.Number]: number;
    [JSType.Boolean]: boolean;
    [JSType.Undefined]: undefined;
    [JSType.Function]: Function;
    [JSType.Object]: object;
    [JSType.Array]: any[];
}

export type JSTypes = JSTypeMap[JSType];

export type JSTypeName<Type> =
    Type extends string ? JSType.String :
    Type extends number ? JSType.Number :
    Type extends boolean ? JSType.Boolean :
    Type extends undefined ? JSType.Undefined :
    Type extends void ? JSType.Undefined :
    Type extends Function ? JSType.Function :
    Type extends any[] ? JSType.Array :
    Type extends object ? JSType.Object :
    Type extends unknown ? JSType :
    JSType.Undefined;

export type IntersectUnion<U> = (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never;

export type HasExtra<X = {}> = {} extends X ? any : X;

export type WithExtra<T, X = {}> = {} extends X ? T : T & X;

export type HasField<K extends keyof any, V> = { [X in K]: V };

export const nothing: any = undefined;

const is_array: (v: any) => v is any[] = Array.isArray || ((v: any) => v instanceof Array);

export function get_type<T>(v: T): JSTypeName<T>;
export function get_type(v: any): JSType;
export function get_type(v: any): JSType {
    const n = (typeof v)[0];
    return n == 's' ? JSType.String :
        n == 'n' ? JSType.Number :
        n == 'b' ? JSType.Boolean :
        n == 'u' ? JSType.Undefined :
        n == 'f' ? JSType.Function :
        is_array(v) ? JSType.Array :
        JSType.Object;
}

export function is_type<T>(v: T, t: JSType.Function): v is Extract<T, Function>;
export function is_type<T>(v: T, t: JSType.Object): v is Extract<T, object>;
export function is_type<T>(v: T, t: JSType.Array): v is Extract<T, any[]>;
export function is_type(v: any, t: JSType.String): v is string;
export function is_type(v: any, t: JSType.Number): v is number;
export function is_type(v: any, t: JSType.Boolean): v is boolean;
export function is_type(v: any, t: JSType.Undefined): v is undefined;
//export function is_type<Value extends JSTypes, Type extends JSType>(v: Value, t: Type): v is JSTypeMap[Type];
export function is_type(v: any, t: JSType): boolean;
export function is_type(v: any, t: JSType) {
    return get_type(v) == t;
}

export function type_name(t: JSType): string {
    return t == JSType.String ? 'string' :
        t == JSType.Number ? 'number' :
        t == JSType.Boolean ? 'boolean' :
        t == JSType.Function ? 'function' :
        t == JSType.Array ? 'array' :
        t == JSType.Object ? 'object' :
        'undefined';
}

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
export function mk_seq<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6, f6: (_: T6) => T7, f7: (_: T7) => T8, f8: (_: T8) => T9, f9: (_: T9) => T10): (_: T1) => T10;
export function mk_seq<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6, f6: (_: T6) => T7, f7: (_: T7) => T8, f8: (_: T8) => T9, f9: (_: T9) => T10, f10: (_: T10) => T11): (_: T1) => T11;
export function mk_seq<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6, f6: (_: T6) => T7, f7: (_: T7) => T8, f8: (_: T8) => T9, f9: (_: T9) => T10, f10: (_: T10) => T11, f11: (_: T11) => T12): (_: T1) => T12;
export function mk_seq<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6, f6: (_: T6) => T7, f7: (_: T7) => T8, f8: (_: T8) => T9, f9: (_: T9) => T10, f10: (_: T10) => T11, f11: (_: T11) => T12, f12: (_: T12) => T13): (_: T1) => T13;
export function mk_seq(...fs: ((_: any) => any)[]): (_: any) => any {
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
export function do_seq<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(_: T1, f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6, f6: (_: T6) => T7, f7: (_: T7) => T8, f8: (_: T8) => T9, f9: (_: T9) => T10): T10;
export function do_seq<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(_: T1, f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6, f6: (_: T6) => T7, f7: (_: T7) => T8, f8: (_: T8) => T9, f9: (_: T9) => T10, f10: (_: T10) => T11): T11;
export function do_seq<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(_: T1, f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6, f6: (_: T6) => T7, f7: (_: T7) => T8, f8: (_: T8) => T9, f9: (_: T9) => T10, f10: (_: T10) => T11, f11: (_: T11) => T12): T12;
export function do_seq<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(_: T1, f1: (_: T1) => T2, f2: (_: T2) => T3, f3: (_: T3) => T4, f4: (_: T4) => T5, f5: (_: T5) => T6, f6: (_: T6) => T7, f7: (_: T7) => T8, f8: (_: T8) => T9, f9: (_: T9) => T10, f10: (_: T10) => T11, f11: (_: T11) => T12, f12: (_: T12) => T13): T13;
export function do_seq(_: any, ...fs: ((_: any) => any)[]): any {
    return mk_seq.apply(nothing, fs)(_);
}

const defer = typeof setImmediate != 'undefined' ?
    [setImmediate, clearImmediate] :
    [((f: () => void) => setTimeout(f, 0)), clearTimeout];

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
        const timer = defer[0](() => {
            fn(...args);
        });
        return () => {
            defer[1](timer);
        };
    };
}

export function bind_method<T, N extends keyof T, F extends T[N] & Function>(self: T, name: N): T[N] {
    return (self[name] as F).bind(self);
}

export type NonFlat<Type> = Type | Type[];

export interface FlatMap<Arg, Res> {
    (list: NonFlat<Arg>[]): Res[];
}

export function flat_map<Arg, Res>(fn: (arg: Arg, idx: number) => NonFlat<Res>): FlatMap<Arg, Res> {
    return (list: NonFlat<Arg>[]) => {
        const res: Res[] = [];
        let n = 0;
        for (let i = 0; i < list.length; i++) op(list[i]);
        return res;

        function op(item: NonFlat<Arg>) {
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

export interface FlatList {
    <Type>(list: NonFlat<Type>[]): Type[];
}

export const flat_list: FlatList = flat_map(identity);

export function flat_all<Type>(...args: NonFlat<Type>[]): Type[] {
    return flat_list(args);
}

export function mix_obj<T extends object>(t: T): T;
export function mix_obj<T1 extends object, T2 extends object>(t1: T1, t2: T2): T1 & T2;
export function mix_obj<T1 extends object, T2 extends object, T3 extends object>(t1: T1, t2: T2, t3: T3): T1 & T2 & T3;
export function mix_obj<T1 extends object, T2 extends object, T3 extends object, T4 extends object>(t1: T1, t2: T2, t3: T3, t4: T4): T1 & T2 & T3 & T4;
export function mix_obj<T1 extends object, T2 extends object, T3 extends object, T4 extends object, T5 extends object>(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5): T1 & T2 & T3 & T4 & T5;
export function mix_obj<T1 extends object, T2 extends object, T3 extends object, T4 extends object, T5 extends object, T6 extends object>(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6): T1 & T2 & T3 & T4 & T5 & T6;
export function mix_obj<T1 extends object, T2 extends object, T3 extends object, T4 extends object, T5 extends object, T6 extends object, T7 extends object>(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7): T1 & T2 & T3 & T4 & T5 & T6 & T7;
export function mix_obj<T1 extends object, T2 extends object, T3 extends object, T4 extends object, T5 extends object, T6 extends object, T7 extends object, T8 extends object>(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7, t8: T8): T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8;
export function mix_obj<T1 extends object, T2 extends object, T3 extends object, T4 extends object, T5 extends object, T6 extends object, T7 extends object, T8 extends object, T9 extends object>(t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7, t8: T8, t9: T9): T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8 & T9;
export function mix_obj(...ts: object[]): object {
    const r = {};
    (mix_to as any)(r, ...ts);
    return r;
}

export function mix_to<T, T1>(to: T | T & T1, t1: T1): void;
export function mix_to<T, T1, T2>(to: T | T & T1 & T2, t1: T1, t2: T2): void;
export function mix_to<T, T1, T2, T3>(to: T | T & T1 & T2 & T3, t1: T1, t2: T2, t3: T3): void;
export function mix_to<T, T1, T2, T3, T4>(to: T | T & T1 & T2 & T3 & T4, t1: T1, t2: T2, t3: T3, t4: T4): void;
export function mix_to<T, T1, T2, T3, T4, T5>(to: T | T & T1 & T2 & T3 & T4 & T5, t1: T1, t2: T2, t3: T3, t4: T4, t5: T5): void;
export function mix_to<T, T1, T2, T3, T4, T5, T6>(to: T | T & T1 & T2 & T3 & T4 & T5 & T6, t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6): void;
export function mix_to<T, T1, T2, T3, T4, T5, T6, T7>(to: T | T & T1 & T2 & T3 & T4 & T5 & T6 & T7, t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7): void;
export function mix_to<T, T1, T2, T3, T4, T5, T6, T7, T8>(to: T | T & T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8, t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7, t8: T8): void;
export function mix_to<T, T1, T2, T3, T4, T5, T6, T7, T8, T9>(to: T | T & T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8 & T9, t1: T1, t2: T2, t3: T3, t4: T4, t5: T5, t6: T6, t7: T7, t8: T8, t9: T9): void;
export function mix_to<T>(to: T | T & object, ...ts: object[]) {
    for (const t of ts) {
        for (const f in t) {
            (to as any)[f] = (t as any)[f];
        }
    }
}

export function is_empty<T extends object | any[] | string>(v: T): boolean {
    if (is_type(v, JSType.String)) {
        return v == '';
    } else if (is_type(v, JSType.Array)) {
        return v.length == 0;
    } else {
        let r = true;
        for (let _ in v) {
            r = false;
            break;
        }
        return r;
    }
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

export function trace(message: string): typeof identity {
    return <T>(_: T) => (console.log(message, _), _);
}
