import { Emit, map_emit } from './emit';
import { Done } from './fork';
import { dummy } from './helper';
import { Option, some, none, is_some, un_some } from './option';
import { Either, a, b } from './either';

export interface Future<Type> {
    (emit: Emit<Type>): Done;
}

export interface FutureConv<Type, NewType> {
    (_: Future<Type>): Future<NewType>;
}

export function future<Type>(val: Type): Future<Type> {
    return (emit: Emit<Type>) => {
        emit(val);
        return dummy;
    };
}

export function wrap_future<R>(fn: () => R): () => Future<R>;
export function wrap_future<A1, R>(fn: (a1: A1) => R): (a1: A1) => Future<R>;
export function wrap_future<A1, A2, R>(fn: (a1: A1, a2: A2) => R): (a1: A1, a2: A2) => Future<R>;
export function wrap_future<A1, A2, A3, R>(fn: (a1: A1, a2: A2, a3: A3) => R): (a1: A1, a2: A2, a3: A3) => Future<R>;
export function wrap_future<A1, A2, A3, A4, R>(fn: (a1: A1, a2: A2, a3: A3, a4: A4) => R): (a1: A1, a2: A2, a3: A3, a4: A4) => Future<R>;
export function wrap_future<A1, A2, A3, A4, A5, R>(fn: (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => R): (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => Future<R>;
export function wrap_future<A1, A2, A3, A4, A5, A6, R>(fn: (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6) => R): (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6) => Future<R>;
export function wrap_future<A1, A2, A3, A4, A5, A6, A7, R>(fn: (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7) => R): (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7) => Future<R>;
export function wrap_future<A1, A2, A3, A4, A5, A6, A7, A8, R>(fn: (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8) => R): (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8) => Future<R>;
export function wrap_future<A1, A2, A3, A4, A5, A6, A7, A8, A9, R>(fn: (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9) => R): (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, a6: A6, a7: A7, a8: A8, a9: A9) => Future<R>;
export function wrap_future(fn: (...args: any[]) => any): (...args: any[]) => Future<any> {
    return (...args: any[]) => future(fn(...args));
}

export function timeout(msec: number): <Type>(val: Type) => Future<Type> {
    return <Type>(val: Type) => {
        return (emit: Emit<Type>) => {
            const timer = setTimeout(() => emit(val), msec);
            return () => { clearTimeout(timer); };
        };
    };
}

export function then_future<Type, NewType>(fn: (data: Type) => Future<NewType>): FutureConv<Type, NewType> {
    return (future: Future<Type>) => {
        return (emit: Emit<NewType>) => {
            return future(val => fn(val)(emit));
        };
    };
}

export function map_future<Type, NewType>(fn: (data: Type) => NewType): FutureConv<Type, NewType> {
    const emit_map = map_emit(fn);
    return (future: Future<Type>) => {
        return (emit: Emit<NewType>) => {
            return future(emit_map(emit));
        };
    };
}

export function select_future<Type>(...fs: Future<Type>[]): Future<Type> {
    return (emit: Emit<Type>) => {
        const u = () => { for (const i in cs) cs[i](); };
        const s = (i: number) => (t: Type) => {
            delete cs[i];
            u();
            emit(t);
        };
        const cs: Record<string, Done> = {};
        for (let i = 0; i < fs.length; i++)
            cs[i] = fs[i](s(i));
        return u;
    };
}

export function either_future<A, B>(fa: Future<A>, fb: Future<B>): Future<Either<A, B>> {
    return select_future(map_future<A, Either<A, B>>(a)(fa), map_future<B, Either<A, B>>(b)(fb));
}

export function join_future<T1, T2>(f1: Future<T1>, f2: Future<T2>): Future<[T1, T2]>;
export function join_future<T1, T2, T3>(f1: Future<T1>, f2: Future<T2>, f3: Future<T3>): Future<[T1, T2, T3]>;
export function join_future<T1, T2, T3, T4>(f1: Future<T1>, f2: Future<T2>, f3: Future<T3>, f4: Future<T4>): Future<[T1, T2, T3, T4]>;
export function join_future<T1, T2, T3, T4, T5>(f1: Future<T1>, f2: Future<T2>, f3: Future<T3>, f4: Future<T4>, f5: Future<T5>): Future<[T1, T2, T3, T4, T5]>;
export function join_future<T1, T2, T3, T4, T5, T6>(f1: Future<T1>, f2: Future<T2>, f3: Future<T3>, f4: Future<T4>, f5: Future<T5>, f6: Future<T6>): Future<[T1, T2, T3, T4, T5, T6]>;
export function join_future<T1, T2, T3, T4, T5, T6, T7>(f1: Future<T1>, f2: Future<T2>, f3: Future<T3>, f4: Future<T4>, f5: Future<T5>, f6: Future<T6>, f7: Future<T7>): Future<[T1, T2, T3, T4, T5, T6, T7]>;
export function join_future<T1, T2, T3, T4, T5, T6, T7, T8>(f1: Future<T1>, f2: Future<T2>, f3: Future<T3>, f4: Future<T4>, f5: Future<T5>, f6: Future<T6>, f7: Future<T7>, f8: Future<T8>): Future<[T1, T2, T3, T4, T5, T6, T7, T8]>;
export function join_future<T1, T2, T3, T4, T5, T6, T7, T8, T9>(f1: Future<T1>, f2: Future<T2>, f3: Future<T3>, f4: Future<T4>, f5: Future<T5>, f6: Future<T6>, f7: Future<T7>, f8: Future<T8>, f9: Future<T9>): Future<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;
export function join_future(...fs: Future<any>[]): Future<any[]> {
    return (emit: Emit<any>) => {
        const r: any[] = new Array(fs.length);
        let n = fs.length;
        const s = (i: number) => (t: any) => {
            r[i] = t;
            delete cs[i];
            if (!--n) emit(r);
        };
        const cs: Record<string, Done> = {};
        for (let i = 0; i < fs.length; i++)
            cs[i] = fs[i](s(i));
        return () => { for (const i in cs) cs[i](); };
    };
}

export function fork_future<Type>(f: Future<Type>): () => Future<Type> {
    let result: Option<Type> = none();
    let cancel: Option<Done> = none();
    let emits: Emit<Type>[] = [];
    return () => is_some(result) ? future(un_some(result)) : (emit: Emit<Type>) => {
        emits.push(emit);
        if (!is_some(cancel)) {
            cancel = some(f(v => {
                result = some(v);
                for (let s of emits) s(v);
                cancel = none();
                emits = [];
            }));
        }
        return () => {
            emits.splice(emits.indexOf(emit), 1);
            if (!emits.length) {
                un_some(cancel)();
                cancel = none();
            }
        };
    };
}
