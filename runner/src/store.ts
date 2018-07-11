import { dummy, is_ok, un_ok } from 'literium';
import { Type, parse, build } from 'literium-json';

export const enum StoreType {
    Session, // saved into the session storage
    Persist, // saved into the local storage
}

export interface StoreCell<T> {
    $: string; // data cell name
    _: T | void; // current value
    d: T; // default value
    j: Type<T>; // validator
    t: StoreType; // holder storage
}

const [_load, _save]: [
    <T>(store: StoreCell<T>) => void,
    <T>(store: StoreCell<T>) => void
] = check() ? [load_, save_] : [dummy, dummy];

export function initStore<T, JT extends T>(name: string, json: Type<JT>, def: T, typ: StoreType = StoreType.Session): StoreCell<T> {
    const store = { $: name, d: def, j: json, t: typ, _: undefined };
    _load(store);
    return store;
}

export function storeType<T>(store: StoreCell<T>): StoreType {
    return store.t;
}

export function loadStore<T>(store: StoreCell<T>): T {
    return store._ != undefined ? store._ : store.d;
}

export function moveStore<T>(store: StoreCell<T>, t: StoreType) {
    if (store.t != t) {
        store.t = t;
        _save(store);
    }
}

export function saveStore<T>(store: StoreCell<T>, data: T | void) {
    store._ = data;
    _save(store);
}

function load_<T>(s: StoreCell<T>) {
    const sess = sessionStorage.getItem(s.$);
    const pers = localStorage.getItem(s.$);
    const raw = sess || pers;
    if (raw) {
        s.t = !sess && !!pers ? StoreType.Persist : StoreType.Session;
        const res = parse(s.j)(raw);
        if (is_ok(res)) {
            s._ = un_ok(res);
            return;
        }
    }
}

function save_<T>(s: StoreCell<T>) {
    sessionStorage.removeItem(s.$);
    localStorage.removeItem(s.$);
    if (s._ != undefined) {
        const res = build(s.j)(s._);
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
