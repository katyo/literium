import { dummy } from 'literium';

export interface Store<Type> {
    load(): Type | void;
    save(data: Type): void;
}

function load_<Type>(name: string): Type | void {
    let raw = localStorage.getItem(name);
    if (!raw) {
        return undefined;
    }
    try {
        return JSON.parse(raw) as Type;
    } catch (e) {
        return undefined;
    }
}

function save_<Type>(name: string, data: Type) {
    localStorage.setItem(name, JSON.stringify(data));
}

function check(): boolean {
    try {
        return typeof localStorage != 'undefined'
    } catch (e) {
        return false;
    }
}

const [load, save]: [
    <Type>(name: string) => Type | void,
    <Type>(name: string, data: Type) => void
] = check() ? [load_, save_] : [dummy, dummy];

export function createStore<Type>(name: string): Store<Type> {
    return {
        load: () => load(name),
        save: data => save(name, data)
    };
}
