import { Keyed, KeyedValue, to_keyed } from './keyed';
import { JSType, is_type, constant, deferred, dummy, do_seq, is_empty } from './helper';
import { Option, some, none, is_some, un_some } from './option';
import { Either, a, b } from './either';

export interface Emit<Signal> {
    (signal: Signal): void;
}

export function map_emit<Signal, OtherSignal>(fn: (signal: OtherSignal) => Signal): (emit: Emit<Signal>) => Emit<OtherSignal> {
    return (emit: Emit<Signal>) => (signal: OtherSignal) => { emit(fn(signal)); };
}

export function key_emit<Signal>(emit: Emit<Signal>): <Key extends keyof any, Signal extends Keyed<Key, KeyedValue<Signal, Key>>>(key: Key) => Emit<KeyedValue<Signal, Key>>;
export function key_emit<Key extends keyof any>(key: Key): <Signal extends Keyed<Key, KeyedValue<Signal, Key>>>(emit: Emit<Signal>) => Emit<KeyedValue<Signal, Key>>;
export function key_emit(arg: keyof any | Emit<any>): (arg2: keyof any | Emit<any>) => Emit<KeyedValue<any, keyof any>> {
    return is_type(arg, JSType.Function) ?
        (key: keyof any) => map_emit(to_keyed(key))(arg)
        : map_emit(to_keyed(arg));
}

export interface Done {
    (): void;
}

export interface Future<Type> {
    (emit: Emit<Type>): Done;
}

export interface FutureConv<Type, NewType> {
    (_: Future<Type>): Future<NewType>;
}

export interface GenericFutureConv {
    <Type>(_: Future<Type>): Future<Type>;
}

export function future<Type>(val: Type): Future<Type>;
export function future(): Future<void>;
export function future<Type>(val?: Type): Future<Type | void> {
    return (emit: Emit<Type | void>) => deferred(emit)(val);
}

export function never<Type>(): Future<Type> {
    return (_emit: Emit<Type>) => dummy;
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

export function timeout(msec: number): Future<number> {
    return emit => {
        const timer = setTimeout(() => emit(msec), msec);
        return () => { clearTimeout(timer); };
    };
}

export function min_delay(msec: number): GenericFutureConv {
    return <Type>(fu: Future<Type>) => do_seq(
        join_future(timeout(msec), fu),
        map_future(([_, r]) => r),
    );
}

export function then_future<Type, NewType>(fn: (data: Type) => Future<NewType>): FutureConv<Type, NewType> {
    return (fu: Future<Type>) => {
        return (emit: Emit<NewType>) => {
            let u = fu(val => { u = fn(val)(emit); });
            return () => { (u as Done)(); };
        };
    };
}

export function map_future<Type, NewType>(fn: (data: Type) => NewType): FutureConv<Type, NewType> {
    const emit_map = map_emit(fn);
    return (fu: Future<Type>) => {
        return (emit: Emit<NewType>) => {
            return fu(emit_map(emit));
        };
    };
}

export function select_future<Type>(...fs: Future<Type>[]): Future<Type> {
    return (emit: Emit<Type>) => {
        const cs: Record<string, Done> = {};
        const u = () => { for (const i in cs) cs[i](); };
        const s = (i: number) => (t: Type) => {
            delete cs[i];
            u();
            emit(t);
        };
        for (let i = 0; i < fs.length; i++)
            cs[i] = fs[i](s(i));
        return u;
    };
}

export function once_future<Type>(f: Future<Type>): Future<Type> {
    let v: Option<Type> = none(); // value
    let i: number = 0; // emitter enumerator
    let r: Record<number, Emit<Type>> = {}; // reserved request emitters
    let c: Done | void; // cancel handle

    // emitter
    function e(t: Type) {
        v = some(t);
        for (const i in r) {
            r[i](t);
        }
        r = {};
    }
    
    return (emit: Emit<Type>) => {
        if (v.$) {
            // respond immediate when already resolved
            return deferred(emit)(v._);
        } else {
            // enumerate request
            const j = i++;
            // add emitter for response
            r[j] = emit;
            // request future unless already requested
            if (!c) c = f(e);
            
            return () => {
                // remove response emitter
                delete r[j];
                // cancel future when no response emitters yet
                if (is_empty(r)) {
                    (c as Done)();
                    c = undefined;
                }
            };
        }
    };
}

export function future_channel<Type>(): [Emit<Type>, Future<Type>] {
    let v: Option<Type> = none(); // value
    let i: number = 0; // emitter enumerator
    let r: Record<number, Emit<Type>> = {}; // reserved emitter
    
    return [(t: Type) => {
        v = some(t);
        for (const i in r) {
            r[i](t);
        }
        r = {};
    }, (emit: Emit<Type>) => {
        // respond immediate when already resolved
        if (v.$) {
            return deferred(emit)(v._);
            // store emitter to future resolve
        } else {
            const j = i++;
            // add response emitter
            r[j] = emit;
            return () => {
                // remove response emitter
                delete r[j];
            };
        }
    }];
}

export function timeout_future(msec: number): <Type>(val: Type) => FutureConv<Type, Type> {
    return val => fut => select_future(map_future(constant(val))(timeout(msec)), fut);
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
        const cs: Record<string, Done> = {};
        let n = fs.length;
        const r: any[] = new Array(n);
        const s = (i: number) => (t: any) => {
            r[i] = t;
            delete cs[i];
            if (!--n) emit(r);
        };
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

export interface Spawn {
    (fut: Future<any>): void;
}

export function task_pool(done: Done): [Spawn, /* run */Done, /* kill */Done] {
    let tasks = 0;
    let index = 0;
    const drops: Record<number, Done> = {};
    function emit(index: number): Done {
        return deferred(() => {
            delete drops[index];
            if (!--tasks) done();
        });
    }
    return [
        (future: Future<any>) => {
            ++tasks; ++index;
            drops[index] = future(emit(index));
        },
        deferred(() => {
            if (!tasks) done();
        }),
        () => {
            for (const index in drops) drops[index]();
        }
    ];
}
