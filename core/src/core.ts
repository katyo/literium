import { VNodeChild } from './vdom';
import { Emit, Fork } from 'literium-base';

export interface Create<State, Signal> {
    (fork: Fork<Signal>): State;
}

export interface Update<State, Signal> {
    (state: Readonly<State>, signal: Signal, fork: Fork<Signal>): State;
}

export interface Render<State, Signal> {
    (state: Readonly<State>, emit: Emit<Signal>): VNodeChild;
}

export interface Component<State, Signal> {
    create: Create<State, Signal>;
    update: Update<State, Signal>;
    render: Render<State, Signal>;
}
