import { VNode, VNodeChild, VNodeChildren, h, VKey, VData } from './vdom';
export { VNode, VNodeChild, VNodeChildren, h, VKey, VData };

export interface Send<Event> {
    (event: Event): void;
}

export interface Done {
    (): void;
}

export interface Fork<Event> {
    (): [Send<Event>, Done];
}

export interface Create<State, Event> {
    (fork: Fork<Event>): State;
}

export interface Update<State, Event> {
    (state: Readonly<State>, event: Event, fork: Fork<Event>): State;
}

export interface Render<State, Event> {
    (state: Readonly<State>, send: Send<Event>): VNodeChild;
}

export interface Component<State, Event> {
    create: Create<State, Event>;
    update: Update<State, Event>;
    render: Render<State, Event>;
}

export interface Tagged { $: string; }
export interface HasId { id: number; }
export interface HasName { name: string; }

export type Keyed<Key, Value> = { $: Key; _: Value };

export function send_map<Event, OtherEvent>(send: Send<Event>, fn: (event: OtherEvent) => Event): Send<OtherEvent> {
    return (event: OtherEvent) => { send(fn(event)); };
}

export function fork_map<Event, OtherEvent>(fork: Fork<Event>, fn: (event: OtherEvent) => Event): Fork<OtherEvent> {
    return () => {
        const [send, done] = fork();
        return [send_map(send, fn), done];
    };
}

export function with_key(key: VKey, vnode: VNodeChild): VNodeChild {
    if (vnode != null && typeof vnode == 'object' && vnode.sel) {
        vnode.key = key;
    }
    return vnode;
}

export const empty: VData = {};
export function dummy() { }

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
