import { JSTypeMap } from './helper';
import { Option, none, ok_some, err_some } from './option';
import { Either } from './either';

export interface Ok<Value> { $: 1, _: Value }

export interface Err<Error> { $: 0, _: Error }

export type Result<Value, Error> = Ok<Value> | Err<Error>;

export type Resultal<Rec, Error> = { [Key in keyof Rec]: Result<Rec[Key], Error> };

export type OkFn<Error> = <Value>(_: Value) => Result<Value, Error>;

export type ErrFn<Value> = <Error>(_: Error) => Result<Value, Error>;

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

export function then_result<Value, Error, Return>(ok_fn: (_: Value) => Return, err_fn: (_: Error) => Return): (_: Result<Value, Error>) => Return {
    return (r: Result<Value, Error>) => r.$ ? ok_fn(r._) : err_fn(r._);
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

export function filter_ok<Value, Error>(fn: (_: Value) => Option<Error>): (_: Result<Value, Error>) => Result<Value, Error> {
    return then_ok((_: Value) => err_some(_)(fn(_)));
}

export function filter_err<Value, Error>(fn: (_: Error) => Option<Value>): (_: Result<Value, Error>) => Result<Value, Error> {
    return then_err((_: Error) => ok_some(_)(fn(_)));
}

export function seek_ok<Value, NewValue, Error>(fn: (_: Value, i: number) => Result<NewValue, Error>, e: Error, reverse?: true): (_: Value[]) => Result<NewValue, Error> {
    return (_: Value[]) => {
        const f = reverse ? _.length - 1 : 0;
        const t = reverse ? -1 : _.length;
        const s = reverse ? -1 : 1;
        for (let i = f; i != t; i += s) {
            const r = fn(_[i], i);
            if (is_ok(r)) return r;
        }
        return err(e);
    };
}

export function seek_err<Value, NewValue, Error>(fn: (_: Value, i: number) => Result<NewValue, Error>, v: NewValue, reverse?: true): (_: Value[]) => Result<NewValue, Error> {
    return (_: Value[]) => {
        const f = reverse ? _.length - 1 : 0;
        const t = reverse ? -1 : _.length;
        const s = reverse ? -1 : 1;
        for (let i = f; i != t; i += s) {
            const r = fn(_[i], i);
            if (is_err(r)) return r;
        }
        return ok(v);
    };
}

export function seek_ok_rec<Value, NewValue, Error>(fn: (_: Value, k: string) => Result<NewValue, Error>, e: Error): (_: Record<string, Value>) => Result<NewValue, Error> {
    return (_: Record<string, Value>) => {
        for (const k in _) {
            const r = fn(_[k], k);
            if (is_ok(r)) return r;
        }
        return err(e);
    };
}

export function seek_err_rec<Value, NewValue, Error>(fn: (_: Value, k: string) => Result<NewValue, Error>, v: NewValue): (_: Record<string, Value>) => Result<NewValue, Error> {
    return (_: Record<string, Value>) => {
        for (const k in _) {
            const r = fn(_[k], k);
            if (is_err(r)) return r;
        }
        return ok(v);
    };
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

export function err_if<Value, Error>(fn: (_: Value) => Option<Error>): (_: Value) => Result<Value, Error> {
    return (_: Value) => err_some(_)(fn(_));
}

export function ok_type<Type extends keyof JSTypeMap>(t: Type): <Value>(_: Value) => Result<JSTypeMap[Type], string> {
    return <Value>(_: Value) => typeof _ == t ? ok(_ as JSTypeMap[Type]) : err(`!${t}`);
}

export function err_type<Type extends keyof JSTypeMap>(t: Type): (_: any) => Result<any, string> {
    return (_: any) => typeof _ != t ? ok(_) : err(`${t}`);
}

export function ok_def<Value>(v: Value | null | undefined | void): Result<Value, void> {
    return v != undefined ? ok(v) : err(undefined);
}

export function err_def<Error>(e: Error | null | undefined | void): Result<void, Error> {
    return e != undefined ? err(e) : ok(undefined);
}

export function ok_def_or<Error>(e: Error): <Value>(v: Value | null | undefined | void) => Result<Value, Error> {
    return <Value>(v: Value | null | undefined | void) => v != undefined ? ok(v) : err(e);
}

export function err_def_or<Value>(v: Value): <Error>(e: Error | null | undefined | void) => Result<Value, Error> {
    return <Error>(e: Error | null | undefined | void) => e != undefined ? err(e) : ok(v);
}

export function ok_def_else<Error>(fn: () => Error): <Value>(v: Value | null | undefined | void) => Result<Value, Error> {
    return <Value>(v: Value | null | undefined | void) => v != undefined ? ok(v) : err(fn());
}

export function err_def_else<Value>(fn: () => Value): <Error>(e: Error | null | undefined | void) => Result<Value, Error> {
    return <Error>(e: Error | null | undefined | void) => e != undefined ? err(e) : ok(fn());
}

export function ok_try<Ret>(fn: () => Ret): () => Result<Ret, Error>;
export function ok_try<Ret, Arg>(fn: (arg: Arg) => Ret): (arg: Arg) => Result<Ret, Error>;
export function ok_try<Ret, Arg1, Arg2>(fn: (arg1: Arg1, arg2: Arg2) => Ret): (arg1: Arg1, arg2: Arg2) => Result<Ret, Error>;
export function ok_try<Ret, Arg1, Arg2, Arg3>(fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3) => Ret): (arg1: Arg1, arg2: Arg2, arg3: Arg3) => Result<Ret, Error>;
export function ok_try<Ret, Arg1, Arg2, Arg3, Arg4>(fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4) => Ret): (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4) => Result<Ret, Error>;
export function ok_try<Ret, Arg1, Arg2, Arg3, Arg4, Arg5>(fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5) => Ret): (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5) => Result<Ret, Error>;
export function ok_try<Ret, Arg1, Arg2, Arg3, Arg4, Arg5, Arg6>(fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6) => Ret): (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6) => Result<Ret, Error>;
export function ok_try<Ret, Arg1, Arg2, Arg3, Arg4, Arg5, Arg6, Arg7>(fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6, arg7: Arg7) => Ret): (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6, arg7: Arg7) => Result<Ret, Error>;
export function ok_try<Ret, Arg1, Arg2, Arg3, Arg4, Arg5, Arg6, Arg7, Arg8>(fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6, arg7: Arg7, arg8: Arg8) => Ret): (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6, arg7: Arg7, arg8: Arg8) => Result<Ret, Error>;
export function ok_try<Ret, Arg1, Arg2, Arg3, Arg4, Arg5, Arg6, Arg7, Arg8, Arg9>(fn: (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6, arg7: Arg7, arg8: Arg8, arg9: Arg9) => Ret): (arg1: Arg1, arg2: Arg2, arg3: Arg3, arg4: Arg4, arg5: Arg5, arg6: Arg6, arg7: Arg7, arg8: Arg8, arg9: Arg9) => Result<Ret, Error>;

export function ok_try<Ret>(fn: (...args: any[]) => Ret): (...args: any[]) => Result<Ret, Error> {
    return (...args: any[]) => {
        try {
            return ok(fn(...args));
        } catch (error) {
            return err(error);
        }
    };
}
