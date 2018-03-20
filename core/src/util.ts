import { Fork, Send } from './core';

export interface Tagged { $: string; }
export interface HasId { id: number; }
export interface HasName { name: string; }

export function identity<Value>(_: Value): Value { return _; }
export function dummy() { }

export interface Keyed<Key, Value> { $: Key; _: Value; }

export function keyed_new<Key, Type>($: Key, _: Type): Keyed<Key, Type> {
    return { $, _ };
}

export function keyed_wrap<Key, Type>($: Key): (_: Type) => Keyed<Key, Type> {
    return (_: Type) => ({ $, _ });
}

export function send_map<Event, OtherEvent>(fn: (event: OtherEvent) => Event): (send: Send<Event>) => Send<OtherEvent> {
    return (send: Send<Event>) => (event: OtherEvent) => { send(fn(event)); };
}

export function send_wrap<Key, OtherEvent>(key: Key): (send: Send<Keyed<Key, OtherEvent>>) => Send<OtherEvent> {
    return send_map(keyed_wrap(key));
}

export function fork_map<Event, OtherEvent>(fn: (event: OtherEvent) => Event): (fork: Fork<Event>) => Fork<OtherEvent> {
    return (fork: Fork<Event>) => () => {
        const [send, done] = fork();
        return [send_map(fn)(send), done];
    };
}

export function fork_wrap<Key, OtherEvent>(key: Key): (fork: Fork<Keyed<Key, OtherEvent>>) => Fork<OtherEvent> {
    return fork_map(keyed_wrap(key));
}

export function flat_map<Arg, Res>(list: Arg[], fn: (arg: Arg, idx: number) => Res | Res[]): Res[] {
    const res: Res[] = [];
    for (let i = 0; i < list.length; i++) {
        const val = fn(list[i], i);
        if (Array.isArray(val)) {
            for (const elm of val) {
                res.push(elm);
            }
        } else {
            res.push(val);
        }
    }
    return res;
}

export function flat_list<Type>(list: (Type | Type[])[]): Type[] {
    return flat_map(list, a => a);
}

export function flat_all<Type>(...args: (Type | Type[])[]): Type[] {
    return flat_map(args, a => a);
}
