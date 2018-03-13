import { Component, h, dummy } from 'literium';

export type State = void;
export type Event = void;

function render() {
    return h('div.wrapper-small', [
        h('p', `Hello, world!`),
    ]);
}

const app: Component<State, Event> = { create: dummy, update: dummy, render };

export default app;
