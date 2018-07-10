import { Keyed, to_keyed } from './keyed';
import { Emit, map_emit } from './emit';

export interface Done {
    (): void;
}

export interface Fork<Signal> {
    (): [Emit<Signal>, Done];
}

export function map_fork<Signal, OtherSignal>(fn: (signal: OtherSignal) => Signal): (fork: Fork<Signal>) => Fork<OtherSignal> {
    return (fork: Fork<Signal>) => () => {
        const [emit, done] = fork();
        return [map_emit(fn)(emit), done];
    };
}

export function keyed_fork<Key>(key: Key): <OtherSignal>(fork: Fork<Keyed<Key, OtherSignal>>) => Fork<OtherSignal> {
    return map_fork(to_keyed(key));
}
