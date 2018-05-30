import { Keyed, to_keyed } from './keyed';

export interface Send<Event> {
    (event: Event): void;
}

export function map_send<Event, OtherEvent>(fn: (event: OtherEvent) => Event): (send: Send<Event>) => Send<OtherEvent> {
    return (send: Send<Event>) => (event: OtherEvent) => { send(fn(event)); };
}

export function keyed_send<Key>(key: Key): <Event>(send: Send<Keyed<Key, Event>>) => Send<Event> {
    return map_send(to_keyed(key));
}
