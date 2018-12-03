import { do_seq } from './helper';
import { Result, ok, err, is_ok, un_ok, un_err, ErrFn, OkFn } from './result';
import { Emit, Done, Future, future, then_future, FutureConv, select_future, map_future, timeout } from './future';

export type FutureResult<Value, Error> = Future<Result<Value, Error>>;

export type FutureResultConv<Value, Error, RValue, RError> = FutureConv<Result<Value, Error>, Result<RValue, RError>>;

export type FutureOkFn<Error> = <Value>(v: Value) => FutureResult<Value, Error>;

export type FutureErrFn<Value> = <Error>(e: Error) => FutureResult<Value, Error>;

export function future_ok<Value, Error>(v: Value): FutureResult<Value, Error>;
export function future_ok<Error>(): FutureResult<void, Error>;
export function future_ok<Value, Error>(v?: Value): FutureResult<Value | void, Error> {
    return future(ok(v));
}

export function future_err<Value, Error>(e: Error): FutureResult<Value, Error>;
export function future_err<Value>(): FutureResult<Value, void>;
export function future_err<Value, Error>(e?: Error): FutureResult<Value, Error | void> {
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

export function join_future_result<T1, T2, E>(f1: FutureResult<T1, E>, f2: FutureResult<T2, E>): FutureResult<[T1, T2], E>;
export function join_future_result<T1, T2, T3, E>(f1: FutureResult<T1, E>, f2: FutureResult<T2, E>, f3: FutureResult<T3, E>): FutureResult<[T1, T2, T3], E>;
export function join_future_result<T1, T2, T3, T4, E>(f1: FutureResult<T1, E>, f2: FutureResult<T2, E>, f3: FutureResult<T3, E>, f4: FutureResult<T4, E>): FutureResult<[T1, T2, T3, T4], E>;
export function join_future_result<T1, T2, T3, T4, T5, E>(f1: FutureResult<T1, E>, f2: FutureResult<T2, E>, f3: FutureResult<T3, E>, f4: FutureResult<T4, E>, f5: FutureResult<T5, E>): FutureResult<[T1, T2, T3, T4, T5], E>;
export function join_future_result<T1, T2, T3, T4, T5, T6, E>(f1: FutureResult<T1, E>, f2: FutureResult<T2, E>, f3: FutureResult<T3, E>, f4: FutureResult<T4, E>, f5: FutureResult<T5, E>, f6: FutureResult<T6, E>): FutureResult<[T1, T2, T3, T4, T5, T6], E>;
export function join_future_result<T1, T2, T3, T4, T5, T6, T7, E>(f1: FutureResult<T1, E>, f2: FutureResult<T2, E>, f3: FutureResult<T3, E>, f4: FutureResult<T4, E>, f5: FutureResult<T5, E>, f6: FutureResult<T6, E>, f7: FutureResult<T7, E>): FutureResult<[T1, T2, T3, T4, T5, T6, T7], E>;
export function join_future_result<T1, T2, T3, T4, T5, T6, T7, T8, E>(f1: FutureResult<T1, E>, f2: FutureResult<T2, E>, f3: FutureResult<T3, E>, f4: FutureResult<T4, E>, f5: FutureResult<T5, E>, f6: FutureResult<T6, E>, f7: FutureResult<T7, E>, f8: FutureResult<T8, E>): FutureResult<[T1, T2, T3, T4, T5, T6, T7, T8], E>;
export function join_future_result<T1, T2, T3, T4, T5, T6, T7, T8, T9, E>(f1: FutureResult<T1, E>, f2: FutureResult<T2, E>, f3: FutureResult<T3, E>, f4: FutureResult<T4, E>, f5: FutureResult<T5, E>, f6: FutureResult<T6, E>, f7: FutureResult<T7, E>, f8: FutureResult<T8, E>, f9: FutureResult<T9, E>): FutureResult<[T1, T2, T3, T4, T5, T6, T7, T8, T9], E>;
export function join_future_result<E>(...fs: FutureResult<any, E>[]): FutureResult<any[], E> {
    return (emit: Emit<Result<any[], E>>) => {
        const cs: Record<string, Done> = {};
        let n = fs.length;
        const r: any[] = new Array(n);
        const s = (i: number) => (t: Result<any, E>) => {
            if (t.$ && n >= 0) {
                r[i] = t._;
                delete cs[i];
                if (!--n) emit(ok(r));
            } else {
                n = 0;
                emit(t);
            }
        };
        for (let i = 0; i < fs.length; i++)
            cs[i] = fs[i](s(i));
        return () => { for (const i in cs) cs[i](); };
    };
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
