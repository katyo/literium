import { dummy, is_ok, un_ok } from 'literium';
import { JsonType, parse, build } from 'literium-json';

export const enum StoreType {
    Session, // saved into the session storage
    Persist, // saved into the local storage
}

export interface StoreCell<Type> {
    $: string; // data cell name
    _: Type | void; // current value
    d: Type; // default value
    j: JsonType<Type>; // validator
    t: StoreType; // holder storage
}

const [_load, _save]: [
    <Type>(store: StoreCell<Type>) => void,
    <Type>(store: StoreCell<Type>) => void
] = check() ? [load_, save_] : [dummy, dummy];

export function initStore<Type, JType extends Type>(name: string, json: JsonType<JType>, def: Type, typ: StoreType = StoreType.Session): StoreCell<Type> {
    const store = { $: name, d: def, j: json, t: typ, _: undefined };
    _load(store);
    return store;
}

export function storeType<Type>(store: StoreCell<Type>): StoreType {
    return store.t;
}

export function loadStore<Type>(store: StoreCell<Type>): Type {
    return store._ != undefined ? store._ : store.d;
}

export function moveStore<Type>(store: StoreCell<Type>, t: StoreType) {
    if (store.t != t) {
        store.t = t;
        _save(store);
    }
}

export function saveStore<Type>(store: StoreCell<Type>, data: Type | void) {
    store._ = data;
    _save(store);
}

function load_<Type>(s: StoreCell<Type>) {
    const sess = sessionStorage.getItem(s.$);
    const pers = localStorage.getItem(s.$);
    const raw = sess || pers;
    if (raw) {
        s.t = !sess && !!pers ? StoreType.Persist : StoreType.Session;
        const res = parse(s.j, raw);
        if (is_ok(res)) {
            s._ = un_ok(res);
            return;
        }
    }
}

function save_<Type>(s: StoreCell<Type>) {
    sessionStorage.removeItem(s.$);
    localStorage.removeItem(s.$);
    if (s._ != undefined) {
        const res = build(s.j, s._);
        if (is_ok(res)) (s.t == StoreType.Persist ? localStorage : sessionStorage).setItem(s.$, un_ok(res));
    }
}

function check(): boolean {
    try {
        return typeof localStorage != 'undefined' && typeof sessionStorage != 'undefined'
    } catch (_) {
        return false;
    }
}
