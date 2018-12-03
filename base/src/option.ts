import { JSTypeMap } from './helper';
import { Result } from './result';
import { Either } from './either';

export interface Some<Value> { $: 1, _: Value }

export interface None { $: 0 }

export type Option<Value> = Some<Value> | None;

export type Optional<Rec> = { [Key in keyof Rec]: Option<Rec[Key]> };

export interface SomeFn<Value> {
    (val: Value): Option<Value>;
}

export interface NoneFn<Value> {
    (): Option<Value>;
}

export function some<Value>(_: Value): Option<Value>;
export function some(): Option<void>;
export function some<Value>(_?: Value): Option<Value | void> {
    return { $: 1, _ };
}

const _none: None = { $: 0 };

export function none<Value>(): Option<Value> {
    return _none as Option<Value>;
}

export function is_some<Value>(o: Option<Value>): o is Some<Value> {
    return !!o.$;
}

export function is_none<Value>(o: Option<Value>): o is None {
    return !o.$;
}

export function then_option<Value, Return>(some_fn: (_: Value) => Return, none_fn: () => Return): (_: Option<Value>) => Return {
    return (o: Option<Value>) => o.$ ? some_fn(o._) : none_fn();
}

export function then_some<Value, NewValue>(fn: (_: Value) => Option<NewValue>): (_: Option<Value>) => Option<NewValue> {
    return (o: Option<Value>) => o.$ ? fn(o._) : o as Option<NewValue>;
}

export function then_none<Value>(fn: () => Option<Value>): (_: Option<Value>) => Option<Value> {
    return (o: Option<Value>) => o.$ ? o : fn();
}

export function map_some<Value, NewValue>(fn: (_: Value) => NewValue): (_: Option<Value>) => Option<NewValue> {
    return then_some(v => some(fn(v)));
}

export function map_none(fn: () => void): <Value>(o: Option<Value>) => Option<Value> {
    return <Value>(o: Option<Value>) => o.$ ? o : (fn(), _none as Option<Value>);
}

export function filter_some<Value>(fn: (_: Value) => boolean): (_: Option<Value>) => Option<Value> {
    return then_some((_: Value) => fn(_) ? some(_) : _none as Option<Value>);
}

export function seek_some<Value, NewValue>(fn: (_: Value, i: number) => Option<NewValue>, reverse?: true): (_: Value[]) => Option<NewValue> {
    return (_: Value[]) => {
        const f = reverse ? _.length - 1 : 0;
        const t = reverse ? -1 : _.length;
        const s = reverse ? -1 : 1;
        for (let i = f; i != t; i += s) {
            const r = fn(_[i], i);
            if (is_some(r)) return r;
        }
        return _none as Option<NewValue>;
    };
}

export function seek_some_rec<Rec, Value>(fn: (_: Rec[keyof Rec], k: keyof Rec) => Option<Value>): (_: Rec) => Option<Value> {
    return (_: Rec) => {
        for (const k in _) {
            const r = fn(_[k], k);
            if (is_some(r)) return r;
        }
        return none();
    };
}

export function and_some<NewValue>(v: NewValue): <Value>(o: Option<Value>) => Option<NewValue> {
    return map_some(() => v);
}

export function or_none<Value>(v: Value): (o: Option<Value>) => Option<Value> {
    return then_none(() => some(v));
}

export function un_some<Value>(opt: Option<Value>): Value {
    if (opt.$) return opt._;
    throw "option none";
}

export function un_some_or<Value>(def: Value): (_: Option<Value>) => Value {
    return (opt: Option<Value>) => opt.$ ? opt._ : def;
}

export function un_some_else<Value>(def: () => Value): (_: Option<Value>) => Value {
    return (opt: Option<Value>) => opt.$ ? opt._ : def();
}

export function ok_some<Value>(o: Option<Value>): Result<Value, void> {
    return o.$ ? { $: 1, _: o._ } : { $: 0, _: undefined };
}

export function ok_some_or<Error>(e: Error): <Value>(_: Option<Value>) => Result<Value, Error> {
    return <Value>(o: Option<Value>) => o.$ ? { $: 1, _: o._ } : { $: 0, _: e };
}

export function ok_some_else<Error>(fn: () => Error): <Value>(_: Option<Value>) => Result<Value, Error> {
    return <Value>(o: Option<Value>) => o.$ ? { $: 1, _: o._ } : { $: 0, _: fn() };
}

export function err_some<Error>(o: Option<Error>): Result<void, Error> {
    return o.$ ? { $: 0, _: o._ } : { $: 1, _: undefined };
}

export function err_some_or<Value>(v: Value): <Error>(_: Option<Error>) => Result<Value, Error> {
    return <Error>(o: Option<Error>) => o.$ ? { $: 0, _: o._ } : { $: 1, _: v };
}

export function err_some_else<Value>(fn: () => Value): <Error>(_: Option<Error>) => Result<Value, Error> {
    return <Error>(o: Option<Error>) => o.$ ? { $: 0, _: o._ } : { $: 1, _: fn() };
}

export function a_some<A>(o: Option<A>): Either<A, void> {
    return o.$ ? { $: 0, _: o._ } : { $: 1, _: undefined };
}

export function a_some_or<B>(b: B): <A>(_: Option<A>) => Either<A, B> {
    return <A>(o: Option<A>) => o.$ ? { $: 0, _: o._ } : { $: 1, _: b };
}

export function a_some_else<B>(fn: () => B): <A>(_: Option<A>) => Either<A, B> {
    return <A>(o: Option<A>) => o.$ ? { $: 0, _: o._ } : { $: 1, _: fn() };
}

export function b_some<B>(o: Option<B>): Either<void, B> {
    return o.$ ? { $: 1, _: o._ } : { $: 0, _: undefined };
}

export function b_some_or<A>(a: A): <B>(_: Option<B>) => Either<A, B> {
    return <B>(o: Option<B>) => o.$ ? { $: 1, _: o._ } : { $: 0, _: a };
}

export function b_some_else<A>(fn: () => A): <B>(_: Option<B>) => Either<A, B> {
    return <B>(o: Option<B>) => o.$ ? { $: 1, _: o._ } : { $: 0, _: fn() };
}

export function some_if<Value>(fn: (_: Value) => boolean): (_: Value) => Option<Value> {
    return (_: Value) => fn(_) ? some(_) : _none as Option<Value>;
}

export function none_if<Value>(fn: (_: Value) => boolean): (_: Value) => Option<Value> {
    return (_: Value) => fn(_) ? _none as Option<Value> : some(_);
}

export function some_is<Value>(d: Value): (_: Value) => Option<Value> {
    return (_: Value) => _ === d ? some(_) : _none as Option<Value>;
}

export function none_is<Value>(d: Value): (_: Value) => Option<Value> {
    return (_: Value) => _ === d ? _none as Option<Value> : some(_);
}

export function some_type<Type extends keyof JSTypeMap>(t: Type): <Value>(_: Value) => Option<JSTypeMap[Type]> {
    return <Value>(_: Value) => typeof _ == t ? some(_ as JSTypeMap[Type]) : _none as Option<JSTypeMap[Type]>;
}

export function some_def<Value>(v: Value | null | undefined | void): Option<Value> {
    return v != undefined ? some(v) : none();
}

export function some_try<Ret>(fn: () => Ret): () => Option<Ret>;
export function some_try<Ret, Arg>(fn: (arg: Arg) => Ret): (arg: Arg) => Option<Ret>;
export function some_try<Ret, Arg1, Arg2>(fn: (arg1: Arg1, arg2: Arg2) => Ret): (arg1: Arg1, arg2: Arg2) => Option<Ret>;
export function some_try<Ret, Arg1, Arg2, Arg3>(fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3) => Ret): (arg1: Arg1, arg2: Arg2, arg3: Arg3) => Option<Ret>;
export function some_try<Ret, Arg1, Arg2, Arg3, Arg4>(fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4) => Ret): (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4) => Option<Ret>;
export function some_try<Ret, Arg1, Arg2, Arg3, Arg4, Arg5>(fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5) => Ret): (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5) => Option<Ret>;
export function some_try<Ret, Arg1, Arg2, Arg3, Arg4, Arg5, Arg6>(fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6) => Ret): (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6) => Option<Ret>;
export function some_try<Ret, Arg1, Arg2, Arg3, Arg4, Arg5, Arg6, Arg7>(fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6, arg7: Arg7) => Ret): (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6, arg7: Arg7) => Option<Ret>;
export function some_try<Ret, Arg1, Arg2, Arg3, Arg4, Arg5, Arg6, Arg7, Arg8>(fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6, arg7: Arg7, arg8: Arg8) => Ret): (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6, arg7: Arg7, arg8: Arg8) => Option<Ret>;
export function some_try<Ret, Arg1, Arg2, Arg3, Arg4, Arg5, Arg6, Arg7, Arg8, Arg9>(fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6, arg7: Arg7, arg8: Arg8, arg9: Arg9) => Ret): (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6, arg7: Arg7, arg8: Arg8, arg9: Arg9) => Option<Ret>;

export function some_try<Ret>(fn: (...args: any[]) => Ret): (...args: any[]) => Option<Ret> {
    return (...args: any[]) => {
        try {
            return some(fn(...args));
        } catch (error) {
            return none();
        }
    };
}
