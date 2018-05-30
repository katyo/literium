export interface Keyed<Key, Value> { $: Key; _: Value; }

export function keyed<Key, Value>($: Key, _: Value): Keyed<Key, Value> {
    return { $, _ };
}

export function to_keyed<Key>($: Key): <Value>(_: Value) => Keyed<Key, Value> {
    return <Value>(_: Value) => ({ $, _ });
}

export function map_key<Key, NewKey>(fn: ($: Key) => NewKey): <Value>(_: Keyed<Key, Value>) => Keyed<NewKey, Value> {
    return <Value>(_: Keyed<Key, Value>) => keyed(fn(_.$), _._);
}

export function map_value<Value, NewValue>(fn: (_: Value) => NewValue): <Key>(_: Keyed<Key, Value>) => Keyed<Key, NewValue> {
    return <Key>(_: Keyed<Key, Value>) => keyed(_.$, fn(_._));
}

export function un_key<Key, Value>(v: Keyed<Key, Value>): Key {
    return v.$;
}

export function un_value<Key, Value>(v: Keyed<Key, Value>): Value {
    return v._;
}
