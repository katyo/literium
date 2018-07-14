import { Spawn, Done } from 'literium-base';
import { VNode } from './vdom';

export interface Patch {
    <R>(_: () => R): () => R;
    <R, T1>(_: (a1: T1) => R): (a1: T1) => R;
    <R, T1, T2>(_: (a1: T1, a2: T2) => R): (a1: T1, a2: T2) => R;
    <R, T1, T2, T3>(_: (a1: T1, a2: T2, a3: T3) => R): (a1: T1, a2: T2, a3: T3) => R;
    <R, T1, T2, T3, T4>(_: (a1: T1, a2: T2, a3: T3, a4: T4) => R): (a1: T1, a2: T2, a3: T3, a4: T4) => R;
    <R, T1, T2, T3, T4, T5>(_: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5) => R): (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5) => R;
    <R, T1, T2, T3, T4, T5, T6>(_: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6) => R): (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6) => R;
    <R, T1, T2, T3, T4, T5, T6, T7>(_: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7) => R): (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7) => R;
    <R, T1, T2, T3, T4, T5, T6, T7, T8>(_: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8) => R): (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8) => R;
    <R, T1, T2, T3, T4, T5, T6, T7, T8, T9>(_: (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8, a9: T9) => R): (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8, a9: T9) => R;
}

export interface Create {
    (patch?: Patch, spawn?: Spawn): Render;
}

export interface Render {
    (): VNode;
}

export function patcher(c: Done): Patch {
    return <R>(f: (...ax: any[]) => R): (...ax: any[]) => R => {
        return (...ax: any[]) => {
            const r = f(...ax);
            c();
            return r;
        };
    }
}
