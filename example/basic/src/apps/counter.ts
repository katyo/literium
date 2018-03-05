import { Component, Send, h } from 'literium/types';

export interface State {
    count: number;
}

export interface Incr {
    $: '++';
}

export interface Decr {
    $: '--';
}

export type Event = Incr | Decr;

function create() {
    return {
        count: 0
    };
}

function update(state: State, event: Event) {
    const { count } = state;
    switch (event.$) {
        case '++': return { count: count + 1 };
        case '--': return { count: count - 1 };
    }
}

function render({ count }: State, send: Send<Event>) {
    return h('div.wrapper-small', [
        h('p', `Counter: ${count}`),
        h('button', {
            on: { click: () => { send({ $: '++' }); } }
        }, "+1"),
        h('button', {
            on: { click: () => { send({ $: '--' }); } }
        }, "-1"),
    ]);
}

const app: Component<State, Event> = { create, update, render };

export default app;
