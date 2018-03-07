import { dummy } from 'literium/types';

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

export const [load, save] = typeof localStorage != 'undefined' ? [load_, save_] : [dummy, dummy];
