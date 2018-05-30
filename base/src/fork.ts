import { Keyed, to_keyed } from './keyed';
import { Send, map_send } from './send';

export interface Done {
    (): void;
}

export interface Fork<Event> {
    (): [Send<Event>, Done];
}

export function map_fork<Event, OtherEvent>(fn: (event: OtherEvent) => Event): (fork: Fork<Event>) => Fork<OtherEvent> {
    return (fork: Fork<Event>) => () => {
        const [send, done] = fork();
        return [map_send(fn)(send), done];
    };
}

export function keyed_fork<Key>(key: Key): <OtherEvent>(fork: Fork<Keyed<Key, OtherEvent>>) => Fork<OtherEvent> {
    return map_fork(to_keyed(key));
}
