import { Result, ok, err, is_ok, un_ok, un_err } from './result';
import { Future, now_future, then_future } from './future';

export type FutureResult<Value, Error> = Future<Result<Value, Error>>;

export function now_future_ok<Value, Error>(v: Value): FutureResult<Value, Error> {
    return now_future(ok(v));
}

export function now_future_err<Value, Error>(e: Error): FutureResult<Value, Error> {
    return now_future(err(e));
}

export function then_future_ok<Value, NewValue, Error>(fn: (v: Value) => FutureResult<NewValue, Error>): (future: FutureResult<Value, Error>) => FutureResult<NewValue, Error> {
    return then_future((r: Result<Value, Error>) => is_ok(r) ? fn(un_ok(r)) : now_future(r as Result<NewValue, Error>));
}

export function then_future_err<Value, Error, NewError>(fn: (e: Error) => FutureResult<Value, NewError>): (future: FutureResult<Value, Error>) => FutureResult<Value, NewError> {
    return then_future((r: Result<Value, Error>) => is_ok(r) ? now_future(r as Result<Value, NewError>) : fn(un_err(r)));
}

export function map_future_ok<Value, NewValue>(fn: (v: Value) => NewValue): <Error>(future: FutureResult<Value, Error>) => FutureResult<NewValue, Error> {
    return then_future(<Error>(r: Result<Value, Error>) => is_ok(r) ? now_future_ok(fn(un_ok(r))) : now_future(r as Result<NewValue, Error>));
}

export function map_future_err<Error, NewError>(fn: (e: Error) => NewError): <Value>(future: FutureResult<Value, Error>) => FutureResult<Value, NewError> {
    return then_future(<Value>(r: Result<Value, Error>) => is_ok(r) ? now_future(r as Result<Value, NewError>) : now_future_err(fn(un_err(r))));
}
