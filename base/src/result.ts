import { Keyed } from './keyed';
import { Option, none } from './option';
import { Either } from './either';

export type Ok<Value> = Keyed<1, Value>;

export type Err<Error> = Keyed<0, Error>;

export type Result<Value, Error> = Ok<Value> | Err<Error>;

export function ok<Value, Error>(val: Value): Result<Value, Error> {
    return { $: 1, _: val };
}

export function err<Value, Error>(err: Error): Result<Value, Error> {
    return { $: 0, _: err };
}

export function is_ok<Value, Error>(r: Result<Value, Error>): r is Ok<Value> {
    return !!r.$;
}

export function is_err<Value, Error>(r: Result<Value, Error>): r is Err<Error> {
    return !r.$;
}

export function then_ok<Value, Error, NewValue>(fn: (_: Value) => Result<NewValue, Error>): (res: Result<Value, Error>) => Result<NewValue, Error> {
    return (res: Result<Value, Error>) => res.$ ? fn(res._) : res as Result<NewValue, Error>;
}

export function then_err<Value, Error, NewError>(fn: (_: Error) => Result<Value, NewError>): (res: Result<Value, Error>) => Result<Value, NewError> {
    return (res: Result<Value, Error>) => res.$ ? res : fn(res._ as Error);
}

export function map_ok<Value, NewValue>(fn: (_: Value) => NewValue): <Error>(res: Result<Value, Error>) => Result<NewValue, Error> {
    return then_ok(v => ok(fn(v)));
}

export function map_err<Error, NewError>(fn: (_: Error) => NewError): <Value>(res: Result<Value, Error>) => Result<Value, NewError> {
    return then_err(e => err(fn(e)));
}

export function and_ok<NewValue>(v: NewValue): <Value, Error>(res: Result<Value, Error>) => Result<NewValue, Error> {
    return map_ok(() => v);
}

export function or_err<NewError>(e: NewError): <Value, Error>(res: Result<Value, Error>) => Result<Value, NewError> {
    return map_err(() => e);
}

export function un_ok<Value, Error>(res: Result<Value, Error>): Value {
    if (res.$) return res._;
    throw "result err";
}

export function un_err<Value, Error>(res: Result<Value, Error>): Error {
    if (!res.$) return res._ as Error;
    throw "result ok";
}

export function un_ok_or<Value>(def: Value): <Error>(res: Result<Value, Error>) => Value {
    return <Error>(res: Result<Value, Error>) => res.$ ? res._ : def;
}

export function un_err_or<Error>(def: Error): <Value>(res: Result<Value, Error>) => Error {
    return <Value>(res: Result<Value, Error>) => res.$ ? def : res._ as Error;
}

export function un_ok_else<Value, Error>(def: (e: Error) => Value): (res: Result<Value, Error>) => Value {
    return (res: Result<Value, Error>) => res.$ ? res._ : def(res._);
}

export function un_err_else<Value, Error>(def: (v: Value) => Error): (res: Result<Value, Error>) => Error {
    return (res: Result<Value, Error>) => res.$ ? def(res._) : res._;
}

export function some_ok<Value, Error>(res: Result<Value, Error>): Option<Value> {
    return res.$ ? res as Option<Value> : none();
}

export function some_err<Value, Error>(res: Result<Value, Error>): Option<Error> {
    return res.$ ? none() : { $: 1, _: res._ };
}

export function a_ok<A, B>(res: Result<A, B>): Either<A, B> {
    return res.$ ? { $: 0, _: res._ } : { $: 1, _: res._ };
}

export function b_ok<A, B>(res: Result<B, A>): Either<A, B> {
    return res;
}
