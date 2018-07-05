import { Keyed } from './keyed';
import { Result } from './result';
import { Either } from './either';

export type Some<Value> = Keyed<1, Value>;
export type None = Keyed<0, void>;
export type Option<Value> = Some<Value> | None;

const _none: None = { $: 0, _: undefined };

export function some<Value>(_: Value): Option<Value> {
    return { $: 1, _ };
}

export function none<Value>(): Option<Value> {
    return _none as Option<Value>;
}

export function is_some<Value>(o: Option<Value>): o is Some<Value> {
    return !!o.$;
}

export function is_none<Value>(o: Option<Value>): o is None {
    return !o.$;
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

export function ok_some<Error>(e: Error): <Value>(_: Option<Value>) => Result<Value, Error> {
    return <Value>(o: Option<Value>) => o.$ ? { $: 1, _: o._ } : { $: 0, _: e };
}

export function err_some<Value>(v: Value): <Error>(_: Option<Error>) => Result<Value, Error> {
    return <Error>(o: Option<Error>) => o.$ ? { $: 0, _: o._ } : { $: 1, _: v };
}

export function a_some<B>(b: B): <A>(_: Option<A>) => Either<A, B> {
    return <A>(o: Option<A>) => o.$ ? { $: 0, _: o._ } : { $: 1, _: b };
}

export function b_some<A>(a: A): <B>(_: Option<B>) => Either<A, B> {
    return <B>(o: Option<B>) => o.$ ? { $: 1, _: o._ } : { $: 0, _: a };
}

export function some_def<Value>(v: Value | void): Option<Value> {
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
