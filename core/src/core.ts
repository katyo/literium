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
