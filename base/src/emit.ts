import { Keyed, to_keyed } from './keyed';

export interface Emit<Signal> {
    (signal: Signal): void;
}

export function map_emit<Signal, OtherSignal>(fn: (signal: OtherSignal) => Signal): (emit: Emit<Signal>) => Emit<OtherSignal> {
    return (emit: Emit<Signal>) => (signal: OtherSignal) => { emit(fn(signal)); };
}

export function keyed_emit<Key>(key: Key): <Signal>(emit: Emit<Keyed<Key, Signal>>) => Emit<Signal> {
    return map_emit(to_keyed(key));
}
