import { VNodeChild } from './vdom';
import { Send, Fork } from 'literium-base';

export interface Create<State, Event> {
    (fork: Fork<Event>): State;
}

export interface Update<State, Event> {
    (state: Readonly<State>, event: Event, fork: Fork<Event>): State;
}

export interface Render<State, Event> {
    (state: Readonly<State>, send: Send<Event>): VNodeChild;
}

export interface Component<State, Event> {
    create: Create<State, Event>;
    update: Update<State, Event>;
    render: Render<State, Event>;
}
