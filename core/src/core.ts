import { VNodeChild } from './vdom';
import { Emit, Spawn } from 'literium-base';

export interface Create<State, Signal> {
    (emit: Emit<Signal>, spawn: Spawn): State;
}

export interface Update<State, Signal> {
    (state: Readonly<State>, signal: Signal, emit: Emit<Signal>, spawn: Spawn): State;
}

export interface Render<State, Signal> {
    (state: Readonly<State>, emit: Emit<Signal>): VNodeChild;
}

export interface Component<State, Signal> {
    create: Create<State, Signal>;
    update: Update<State, Signal>;
    render: Render<State, Signal>;
}
