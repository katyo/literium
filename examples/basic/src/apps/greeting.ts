import { Component, Send, VNode, h } from 'literium';
import { KeyCode } from 'literium/keys';

export interface State {
    name: string | null;
}

export type Event =
    { $: 'set-name', name: string } |
    { $: 'revert' };

function create() {
    return {
        name: null
    };
}

function update(state: State, event: Event) {
    switch (event.$) {
        case 'set-name': return { name: event.name };
        case 'revert': return { name: null };
    }
}

function render({ name }: State, send: Send<Event>) {
    let input: HTMLInputElement;
    const bind_input = (_vnode: VNode, vnode: VNode) => {
        input = vnode.elm as HTMLInputElement;
    };

    return h('div.wrapper-small', name === null ? [
        h('label.textfield', [
            h('input', {
                hook: { create: bind_input }, on: {
                    keydown: e => { if (e.keyCode == KeyCode.Enter) { send({ $: 'set-name', name: input.value }); } }
                }, attrs: { type: 'text' }
            }),
            h('span.textfield__label', 'Enter your name:'),
        ]),
        h('button', { on: { click: () => { send({ $: 'set-name', name: input.value }); } } }, 'Greeting!'),
    ] : [
            h('p', `Hello, ${name == '' ? 'world' : name}!`),
            h('button.btn--link', { on: { click: () => { send({ $: 'revert' }); } } }, 'Again?'),
        ]);
}

const app: Component<State, Event> = { create, update, render };

export default app;
