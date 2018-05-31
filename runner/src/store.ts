import { dummy } from 'literium';

export interface StoreData<Type> {
    $?: boolean; // data is persistent
    _?: Type; // actual data value
}

export interface StoreCell<Type> {
    $: string; // data cell name
    _: Type; // default value
}

const [_load, _save]: [
    <Type>(name: string) => StoreData<Type> | void,
    <Type>(name: string, data: StoreData<Type>) => void
] = check() ? [load_, save_] : [dummy, dummy];

export function initStore<Type>(name: string, def: Type): StoreCell<Type> {
    return { $: name, _: def };
}

export function loadStore<Type>(store: StoreCell<Type>): Type {
    const cell = _load<Type>(store.$);
    return cell ? cell._ as Type : store._;
}

export function saveStore<Type>(store: StoreCell<Type>, data?: Type, persist?: boolean) {
    const cell = _load<Type>(store.$) || { _: store._ };
    if (persist != undefined) cell.$ = persist;
    cell._ = data;
    _save(store.$, cell);
}

function load_<Type>(name: string): StoreData<Type> | void {
    const raw1 = sessionStorage.getItem(name);
    const raw2 = localStorage.getItem(name);
    const raw = raw1 || raw2;
    if (!raw) return;
    const persist = !raw1 && !!raw2;
    try {
        return { $: persist, _: JSON.parse(raw) as Type };
    } catch (_) { }
}

function save_<Type>(name: string, { $: persist, _: data }: StoreData<Type>) {
    sessionStorage.removeItem(name);
    localStorage.removeItem(name);
    if (persist != undefined && data != undefined) {
        const json = JSON.stringify(data);
        (persist ? localStorage : sessionStorage).setItem(name, json);
    }
}

function check(): boolean {
    try {
        return typeof localStorage != 'undefined' && typeof sessionStorage != 'undefined'
    } catch (_) {
        return false;
    }
}
