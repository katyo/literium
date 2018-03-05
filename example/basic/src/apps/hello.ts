import { Component, h } from 'literium/types';

export type State = void;
export type Event = void;

function create() { return undefined; }
function update() { return undefined; }

function render() {
    return h('div.wrapper-small', [
        h('p', `Hello, world!`),
    ]);
}

const app: Component<State, Event> = { create, update, render };

export default app;
