import { VNode, VNodes, h, VKey, VData } from './vdom';
export { VNode, VNodes, h, VKey, VData };

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
    (state: Readonly<State>, send: Send<Event>): VNode;
}

export interface Component<State, Event> {
    create: Create<State, Event>;
    update: Update<State, Event>;
    render: Render<State, Event>;
}

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

export function with_key(key: VKey, vnode: VNode): VNode {
    vnode.key = key;
    return vnode;
}

export const empty: VData = {};
export function dummy() {}
