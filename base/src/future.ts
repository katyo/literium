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
