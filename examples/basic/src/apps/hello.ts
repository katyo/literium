import { dummy } from '@literium/base';
import { Component, h } from '@literium/core';

export type Props = void;
export type State = void;
export type Signal = void;

function render() {
    return h('div.wrapper-small', [
        h('p', `Hello, world!`),
    ]);
}

export default { create: dummy, update: dummy, render } as Component<Props, State, Signal>;
