import { VNodeChild } from './vdom';
import { Emit, Spawn } from 'literium-base';

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
    (props: Props, state: Readonly<State>, spawn: Spawn): void;
}

export interface ViewlessComponent<Props, State, Signal> {
    create: Create<Props, State, Signal>;
    change?: Change<Props, State, Signal>;
    update: Update<Props, State, Signal>;
    remove?: Remove<Props, State, Signal>;
}

export interface Component<Props, State, Signal> extends ViewlessComponent<Props, State, Signal> {
    render: Render<Props, State, Signal>;
}
