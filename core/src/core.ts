import { Emit, Spawn } from '@literium/base';
import { VNodeChild } from './vdom';

export interface Create<Props, State, Signal> {
    (props: Props, emit: Emit<Signal>, spawn: Spawn): State;
}

export interface Change<Props, State, Signal> {
    (props: Props, state: Readonly<State>, emit: Emit<Signal>, spawn: Spawn): State;
}

export interface Update<Props, State, Signal> {
    (props: Props, state: Readonly<State>, signal: Signal, emit: Emit<Signal>, spawn: Spawn): State;
}

export interface Render<Props, State, Signal> {
    (props: Props, state: Readonly<State>, emit: Emit<Signal>): VNodeChild;
}

export interface Remove<Props, State, Signal> {
    (props: Props, state: Readonly<State>, emit: Emit<Signal>, spawn: Spawn): State;
}

export interface Module<Props, State, Signal> {
    create: Create<Props, State, Signal>;
    change?: Change<Props, State, Signal>;
    update: Update<Props, State, Signal>;
    remove?: Remove<Props, State, Signal>;
}

export interface Component<Props, State, Signal> extends Module<Props, State, Signal> {
    render: Render<Props, State, Signal>;
}

export function merge<P0, S0, E0, P1, S1, E1>(m0: Module<P0, S0, E0>, m1: Module<P1, S1, E1>): Module<P0 & P1, S0 & S1, E0 | E1>;
export function merge<P0, S0, E0, P1, S1, E1, P2, S2, E2>(m0: Module<P0, S0, E0>, m1: Module<P1, S1, E1>, m2: Module<P2, S2, E2>): Module<P0 & P1 & P2, S0 & S1 & S2, E0 | E1 | E2>;
export function merge<P0, S0, E0, P1, S1, E1, P2, S2, E2, P3, S3, E3>(m0: Module<P0, S0, E0>, m1: Module<P1, S1, E1>, m2: Module<P2, S2, E2>, m3: Module<P3, S3, E3>): Module<P0 & P1 & P2 & P3, S0 & S1 & S2 & S3, E0 | E1 | E2 | E3>;
export function merge<P0, S0, E0, P1, S1, E1, P2, S2, E2, P3, S3, E3, P4, S4, E4>(m0: Module<P0, S0, E0>, m1: Module<P1, S1, E1>, m2: Module<P2, S2, E2>, m3: Module<P3, S3, E3>, m4: Module<P4, S4, E4>): Module<P0 & P1 & P2 & P3 & P4, S0 & S1 & S2 & S3 & S4, E0 | E1 | E2 | E3 | E4>;
export function merge<P0, S0, E0, P1, S1, E1, P2, S2, E2, P3, S3, E3, P4, S4, E4, P5, S5, E5>(m0: Module<P0, S0, E0>, m1: Module<P1, S1, E1>, m2: Module<P2, S2, E2>, m3: Module<P3, S3, E3>, m4: Module<P4, S4, E4>, m5: Module<P5, S5, E5>): Module<P0 & P1 & P2 & P3 & P4 & P5, S0 & S1 & S2 & S3 & S4 & S5, E0 | E1 | E2 | E3 | E4 | E5>;
export function merge<P0, S0, E0, P1, S1, E1, P2, S2, E2, P3, S3, E3, P4, S4, E4, P5, S5, E5, P6, S6, E6>(m0: Module<P0, S0, E0>, m1: Module<P1, S1, E1>, m2: Module<P2, S2, E2>, m3: Module<P3, S3, E3>, m4: Module<P4, S4, E4>, m5: Module<P5, S5, E5>, m6: Module<P6, S6, E6>): Module<P0 & P1 & P2 & P3 & P4 & P5 & P6, S0 & S1 & S2 & S3 & S4 & S5 & S6, E0 | E1 | E2 | E3 | E4 | E5 | E6>;
export function merge<P0, S0, E0, P1, S1, E1, P2, S2, E2, P3, S3, E3, P4, S4, E4, P5, S5, E5, P6, S6, E6, P7, S7, E7>(m0: Module<P0, S0, E0>, m1: Module<P1, S1, E1>, m2: Module<P2, S2, E2>, m3: Module<P3, S3, E3>, m4: Module<P4, S4, E4>, m5: Module<P5, S5, E5>, m6: Module<P6, S6, E6>, m7: Module<P7, S7, E7>): Module<P0 & P1 & P2 & P3 & P4 & P5 & P6 & P7, S0 & S1 & S2 & S3 & S4 & S5 & S6 & S7, E0 | E1 | E2 | E3 | E4 | E5 | E6 | E7>;
export function merge<P0, S0, E0, P1, S1, E1, P2, S2, E2, P3, S3, E3, P4, S4, E4, P5, S5, E5, P6, S6, E6, P7, S7, E7, P8, S8, E8>(m0: Module<P0, S0, E0>, m1: Module<P1, S1, E1>, m2: Module<P2, S2, E2>, m3: Module<P3, S3, E3>, m4: Module<P4, S4, E4>, m5: Module<P5, S5, E5>, m6: Module<P6, S6, E6>, m7: Module<P7, S7, E7>, m8: Module<P8, S8, E8>): Module<P0 & P1 & P2 & P3 & P4 & P5 & P6 & P7 & P8, S0 & S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8, E0 | E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8>;
export function merge<P0, S0, E0, P1, S1, E1, P2, S2, E2, P3, S3, E3, P4, S4, E4, P5, S5, E5, P6, S6, E6, P7, S7, E7, P8, S8, E8, P9, S9, E9>(m0: Module<P0, S0, E0>, m1: Module<P1, S1, E1>, m2: Module<P2, S2, E2>, m3: Module<P3, S3, E3>, m4: Module<P4, S4, E4>, m5: Module<P5, S5, E5>, m6: Module<P6, S6, E6>, m7: Module<P7, S7, E7>, m8: Module<P8, S8, E8>, m9: Module<P9, S9, E9>): Module<P0 & P1 & P2 & P3 & P4 & P5 & P6 & P7 & P8 & P9, S0 & S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8 & S9, E0 | E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9>;
export function merge(...ms: Module<any, any, any>[]): Module<any, any, any> {
    return {
        create(props, emit, spawn) {
            let state = {};
            for (const {create} of ms) {
                state = { ...state, ...create(props, emit, spawn) };
            }
            return state;
        },
        change: hasAnyProp('change', ...ms) ? (props, state, emit, spawn) => {
            for (const {change} of ms) {
                if (change) {
                    state = { ...state, ...change(props, state, emit, spawn) };
                }
            }
            return state;
        } : undefined,
        update(props, state, signal, emit, spawn) {
            for (const {update} of ms) {
                state = { ...state, ...update(props, state, signal, emit, spawn) };
            }
            return state;
        },
        remove: hasAnyProp('remove', ...ms) ? (props, state, emit, spawn) => {
            for (const {remove} of ms) {
                if (remove) {
                    state = { ...state, ...remove(props, state, emit, spawn) };
                }
            }
            return state;
        } : undefined,
    };
}

export function hasAnyProp<TS extends any[]>(prop: keyof TS[number], ...objs: TS): boolean {
    for (const obj in objs) if (objs[obj][prop]) return true;
    return false;
}
