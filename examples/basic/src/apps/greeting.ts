import { Emit } from '@literium/base';
import { Component, VNode, KeyCode, h } from '@literium/core';

export type Props = void;

export interface State {
    name: string | null;
}

export type Signal =
    { $: 'set-name', name: string } |
    { $: 'revert' };

function create() {
    return {
        name: null
    };
}

function update(_props: Props, _state: State, signal: Signal) {
    switch (signal.$) {
        case 'set-name': return { name: signal.name };
        case 'revert': return { name: null };
    }
}

function render(_props: Props, { name }: State, emit: Emit<Signal>) {
    let input: HTMLInputElement;
    const bind_input = (_vnode: VNode, vnode: VNode) => {
        input = vnode.elm as HTMLInputElement;
    };

    return h('div.wrapper-small', name === null ? [
        h('label.textfield', [
            h('input', {
                hook: { create: bind_input }, on: {
                    keydown: e => { if (e.keyCode == KeyCode.Enter) { emit({ $: 'set-name', name: input.value }); } }
                }, attrs: { type: 'text' }
            }),
            h('span.textfield__label', 'Enter your name:'),
        ]),
        h('button', { on: { click: () => { emit({ $: 'set-name', name: input.value }); } } }, 'Greeting!'),
    ] : [
            h('p', `Hello, ${name == '' ? 'world' : name}!`),
            h('button.btn--link', { on: { click: () => { emit({ $: 'revert' }); } } }, 'Again?'),
        ]);
}

export default { create, update, render } as Component<Props, State, Signal>;
