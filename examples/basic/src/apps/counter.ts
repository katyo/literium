import { Emit, AsKeyed } from '@literium/base'
import { Component, h } from '@literium/core';

export type Props = void;

export interface State {
    count: number;
}

export type Signal = AsKeyed<{
    '++': void,
    '--': void,
}>;

function create() {
    return {
        count: 0
    };
}

function update(_props: Props, state: State, signal: Signal) {
    const { count } = state;
    switch (signal.$) {
        case '++': return { count: count + 1 };
        case '--': return { count: count - 1 };
    }
}

function render(_props: Props, { count }: State, emit: Emit<Signal>) {
    return h('div.wrapper-small', [
        h('p', `Counter: ${count}`),
        h('button', {
            on: { click: () => { emit({ $: '++', _: undefined }); } }
        }, "+1"),
        h('button', {
            on: { click: () => { emit({ $: '--', _: undefined }); } }
        }, "-1"),
    ]);
}

export default { create, update, render } as Component<Props, State, Signal>;
