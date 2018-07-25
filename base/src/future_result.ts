import { do_seq } from './helper';
import { Result, ok, err, is_ok, un_ok, un_err, ErrFn, OkFn } from './result';
import { Emit, Future, future, then_future, FutureConv, select_future, map_future, timeout } from './future';

export type FutureResult<Value, Error> = Future<Result<Value, Error>>;

export type FutureResultConv<Value, Error, RValue, RError> = FutureConv<Result<Value, Error>, Result<RValue, RError>>;

export type FutureOkFn<Error> = <Value>(v: Value) => FutureResult<Value, Error>;

export type FutureErrFn<Value> = <Error>(e: Error) => FutureResult<Value, Error>;

export function future_ok<Value, Error>(v: Value): FutureResult<Value, Error> {
    return future(ok(v));
}

export function future_err<Value, Error>(e: Error): FutureResult<Value, Error> {
    return future(err(e));
}

export function then_future_ok<Value, NewValue, Error>(fn: (v: Value) => FutureResult<NewValue, Error>): FutureResultConv<Value, Error, NewValue, Error> {
    return then_future((r: Result<Value, Error>) => is_ok(r) ? fn(un_ok(r)) : future(r as Result<NewValue, Error>));
}

export function then_future_err<Value, Error, NewError>(fn: (e: Error) => FutureResult<Value, NewError>): FutureResultConv<Value, Error, Value, NewError> {
    return then_future((r: Result<Value, Error>) => is_ok(r) ? future(r as Result<Value, NewError>) : fn(un_err(r)));
}

export function map_future_ok<Value, NewValue>(fn: (v: Value) => NewValue): <Error>(future: FutureResult<Value, Error>) => FutureResult<NewValue, Error> {
    return then_future(<Error>(r: Result<Value, Error>) => is_ok(r) ? future_ok(fn(un_ok(r))) : future(r as Result<NewValue, Error>));
}

export function map_future_err<Error, NewError>(fn: (e: Error) => NewError): <Value>(future: FutureResult<Value, Error>) => FutureResult<Value, NewError> {
    return then_future(<Value>(r: Result<Value, Error>) => is_ok(r) ? future(r as Result<Value, NewError>) : future_err(fn(un_err(r))));
}

export function future_async<T, E>(fn: (cb: (error?: E, value?: T) => void) => void): FutureResult<T, E>;
export function future_async<T, E, T1>(fn: (a1: T1, cb: (error?: E, value?: T) => void) => void, a1: T1): FutureResult<T, E>;
export function future_async<T, E, T1, T2>(fn: (a1: T1, a2: T2, cb: (error?: E, value?: T) => void) => void, a1: T1, a2: T2): FutureResult<T, E>;
export function future_async<T, E, T1, T2, T3>(fn: (a1: T1, a2: T2, a3: T3, cb: (error?: E, value?: T) => void) => void, a1: T1, a2: T2, a3: T3): FutureResult<T, E>;
export function future_async<T, E, T1, T2, T3, T4>(fn: (a1: T1, a2: T2, a3: T3, a4: T4, cb: (error?: E, value?: T) => void) => void, a1: T1, a2: T2, a3: T3, a4: T4): FutureResult<T, E>;
export function future_async<T, E, T1, T2, T3, T4, T5>(fn: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, cb: (error?: E, value?: T) => void) => void, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5): FutureResult<T, E>;
export function future_async<T, E, T1, T2, T3, T4, T5, T6>(fn: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, cb: (error?: E, value?: T) => void) => void, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6): FutureResult<T, E>;
export function future_async<T, E, T1, T2, T3, T4, T5, T6, T7>(fn: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, cb: (error?: E, value?: T) => void) => void, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7): FutureResult<T, E>;
export function future_async<T, E, T1, T2, T3, T4, T5, T6, T7, T8>(fn: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8, cb: (error?: E, value?: T) => void) => void, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8): FutureResult<T, E>;
export function future_async<T, E, T1, T2, T3, T4, T5, T6, T7, T8, T9>(fn: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8, a9: T9, cb: (error?: E, value?: T) => void) => void, a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8, a9: T9): FutureResult<T, E>;
export function future_async<T, E>(fn: (...a: any[]) => void, ...a: any[]): FutureResult<T, E> {
    return (emit: Emit<Result<T, E>>) => {
        let final = false;
        fn(...a, (error: E, value: T) => {
            if (!final) {
                final = true;
                if (error) {
                    emit(err(error));
                } else {
                    emit(ok(value));
                }
            }
        });
        return () => {
            final = true;
        };
    };
}

export function max_delay(msec: number): <Type>(fu: Future<Type>) => Future<Result<Type, number>> {
    return <Type>(fu: Future<Type>) => select_future(
        do_seq(
            timeout(msec),
            map_future(err as ErrFn<Type>)
        ), do_seq(
            fu,
            map_future(ok as OkFn<number>)
        )
    );
}
