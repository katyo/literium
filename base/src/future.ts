import { Send, map_send } from './send';
import { Done } from './fork';
import { dummy } from './helper';

export interface Future<Type> {
    (send: Send<Type>): Done;
}

export function future<Type>(val: Type): Future<Type> {
    return (send: Send<Type>) => {
        send(val);
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
        return (send: Send<Type>) => {
            const timer = setTimeout(() => send(val), msec);
            return () => { clearTimeout(timer); };
        };
    };
}

export function then_future<Type, NewType>(fn: (data: Type) => Future<NewType>): (future: Future<Type>) => Future<NewType> {
    return (future: Future<Type>) => {
        return (send: Send<NewType>) => {
            return future(val => fn(val)(send));
        };
    };
}

export function map_future<Type, NewType>(fn: (data: Type) => NewType): (future: Future<Type>) => Future<NewType> {
    const send_map = map_send(fn);
    return (future: Future<Type>) => {
        return (send: Send<NewType>) => {
            return future(send_map(send));
        };
    };
}
