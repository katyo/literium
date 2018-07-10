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

export type Paired<Rec> = { [Key in keyof Rec]: { [K in Key]: Rec[K] } }[keyof Rec];

export type PairedAsKeyed<Rec> = { [Key in keyof Rec]: Keyed<Key, Rec[Key]> }[keyof Rec];

export function paired<Rec, Key extends keyof Rec, Value extends Rec[Key]>($: Key, _: Value): Paired<Rec> {
    return { [$]: _ } as any as Paired<Rec>;
}

export function paired_key<Rec>(x: Paired<Rec>): keyof Rec {
    for (const k in x) return k;
    throw 0;
}

export function paired_value<Rec>(x: Paired<Rec>): Rec[keyof Rec] {
    for (const k in x) return x[k];
    throw 0;
}

export function paired_to_keyed<Rec>(x: Paired<Rec>): PairedAsKeyed<Rec> {
    for (const k in x) return keyed(k, x[k]);
    throw 0;
}

export function keyed_to_paired<Rec>({ $, _ }: PairedAsKeyed<Rec>): Paired<Rec> {
    return { [$]: _ } as any as Paired<Rec>;
}
