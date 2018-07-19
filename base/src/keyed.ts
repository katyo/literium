export interface Keyed<Key extends keyof any, Value> { $: Key; _: Value; }

export type KeyedKeys<Enum> = Enum extends Keyed<infer Key, infer Value> ? Key : Enum extends Keyed<infer Key, infer Value>[] ? Key : never;

export type KeyedValue<Enum, Key extends keyof any> = Enum extends Keyed<Key, infer Value> ? Value : Enum extends Keyed<Key, infer Value>[] ? Value : never;

export type KeyedAsPaired<Enum> = { [K in KeyedKeys<Enum>]: KeyedValue<Enum, K>; };

export function keyed<Key extends keyof any, Value>($: Key, _: Value): Keyed<Key, Value> {
    return { $, _ };
}

export function to_keyed<Key extends keyof any>($: Key): <Value>(_: Value) => Keyed<Key, Value> {
    return <Value>(_: Value) => ({ $, _ });
}

export function map_key<Key extends keyof any, NewKey extends keyof any>(fn: ($: Key) => NewKey): <Value>(_: Keyed<Key, Value>) => Keyed<NewKey, Value> {
    return <Value>(_: Keyed<Key, Value>) => keyed(fn(_.$), _._);
}

export function map_value<Value, NewValue>(fn: (_: Value) => NewValue): <Key extends keyof any>(_: Keyed<Key, Value>) => Keyed<Key, NewValue> {
    return <Key extends keyof any>(_: Keyed<Key, Value>) => keyed(_.$, fn(_._));
}

export function un_key<Key extends keyof any, Value>(v: Keyed<Key, Value>): Key {
    return v.$;
}

export function un_value<Key extends keyof any, Value>(v: Keyed<Key, Value>): Value {
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
