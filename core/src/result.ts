import { Option, option_none } from './option';
import { Either } from './either';

export type Result<Value, Error> = { $: 1, _: Value; } | { $: 0, _: Error };

export function result_ok<Value, Error>(val: Value): Result<Value, Error> {
    return { $: 1, _: val };
}

export function result_err<Value, Error>(err: Error): Result<Value, Error> {
    return { $: 0, _: err };
}

export function result_map<Value, NewValue, Error>(fn: (_: Value) => NewValue): (res: Result<Value, Error>) => Result<NewValue, Error> {
    return (res: Result<Value, Error>) => res.$ ? { $: 1, _: fn(res._) } : res as Result<NewValue, Error>;
}

export function result_map_err<Value, Error, NewError>(fn: (_: Error) => NewError): (res: Result<Value, Error>) => Result<Value, NewError> {
    return (res: Result<Value, Error>) => res.$ ? res : { $: 0, _: fn(res._ as Error) };
}

export function result_unwrap<Value, Error>(res: Result<Value, Error>): Value {
    if (res.$) return res._;
    throw "result err";
}

export function result_unwrap_or<Value>(def: Value): <Error>(res: Result<Value, Error>) => Value {
    return <Error>(res: Result<Value, Error>) => res.$ ? res._ : def;
}

export function result_unwrap_err<Value, Error>(res: Result<Value, Error>): Error {
    if (!res.$) return res._ as Error;
    throw "result ok";
}

export function result_unwrap_err_or<Error>(def: Error): <Value>(res: Result<Value, Error>) => Error {
    return <Value>(res: Result<Value, Error>) => res.$ ? def : res._ as Error;
}

export function result_option<Value, Error>(res: Result<Value, Error>): Option<Value> {
    return res.$ ? res as Option<Value> : option_none();
}

export function result_option_err<Value, Error>(res: Result<Value, Error>): Option<Error> {
    return res.$ ? option_none() : res as Option<Error>;
}

export const result_either = <Value, Error>(_: Result<Value, Error>) => _ as Either<Error, Value>;
