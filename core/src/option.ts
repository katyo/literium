import { Result } from './result';
import { Either } from './either';

export type Option<Value> = { $: 1, _: Value; } | { $: 0 };

const _none = { $: 0 };

export function some<Value>(val: Value): Option<Value> {
    return { $: 1, _: val };
}

export function none<Value>(): Option<Value> {
    return _none as Option<Value>;
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

export function map_none(fn: () => void): <Value>(_: Option<Value>) => Option<Value> {
    return <Value>(o: Option<Value>) => o.$ ? o : (fn(), _none as Option<Value>);
}

export function unwrap_some<Value>(opt: Option<Value>): Value {
    if (opt.$) return opt._;
    throw "option none";
}

export function unwrap_some_or<Value>(def: Value): (_: Option<Value>) => Value {
    return (opt: Option<Value>) => opt.$ ? opt._ : def;
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
