import { dummy, is_ok, un_ok } from 'literium';
import { JsonType, parse, build } from 'literium-json';

export interface StoreData<Type> {
    $?: boolean; // data is persistent
    _?: Type; // actual data value
}

export interface StoreCell<Type> {
    $: string; // data cell name
    _: Type; // default value
    j: JsonType<Type>; // validator
}

const [_load, _save]: [
    <Type>(name: string, json: JsonType<Type>) => StoreData<Type> | void,
    <Type>(name: string, json: JsonType<Type>, data: StoreData<Type>) => void
] = check() ? [load_, save_] : [dummy, dummy];

export function initStore<Type, JType extends Type>(name: string, json: JsonType<JType>, def: Type): StoreCell<Type> {
    return { $: name, _: def, j: json };
}

export function loadStore<Type>(store: StoreCell<Type>): Type {
    const cell = _load(store.$, store.j);
    return cell ? cell._ as Type : store._;
}

export function saveStore<Type>(store: StoreCell<Type>, data?: Type, persist?: boolean) {
    const cell = _load(store.$, store.j) || { _: store._ };
    if (persist != undefined) cell.$ = persist;
    cell._ = data;
    _save(store.$, store.j, cell);
}

function load_<Type>(name: string, json: JsonType<Type>): StoreData<Type> | void {
    const raw1 = sessionStorage.getItem(name);
    const raw2 = localStorage.getItem(name);
    const raw = raw1 || raw2;
    if (!raw) return;
    const persist = !raw1 && !!raw2;
    const res = parse(json, raw);
    return is_ok(res) ? { $: persist, _: un_ok(res) } : undefined;
}

function save_<Type>(name: string, json: JsonType<Type>, { $: persist, _: data }: StoreData<Type>) {
    sessionStorage.removeItem(name);
    localStorage.removeItem(name);
    if (persist != undefined && data != undefined) {
        const res = build(json, data);
        if (is_ok(res)) (persist ? localStorage : sessionStorage).setItem(name, un_ok(res));
    }
}

function check(): boolean {
    try {
        return typeof localStorage != 'undefined' && typeof sessionStorage != 'undefined'
    } catch (_) {
        return false;
    }
}
