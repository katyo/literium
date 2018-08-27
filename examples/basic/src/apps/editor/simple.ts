import { a, b, keyed, Emit } from '@literium/base';
import { VNode, h } from '@literium/core';
import { State, Signal, Selection } from './common';

export function render(state: State, emit: Emit<Signal>): VNode {
    return h('textarea', {
        props: {
            value: state.content,
            selectionStart: startSelection(state.selection),
            selectionEnd: endSelection(state.selection),
        },
        on: {
            click: (_event: MouseEvent, vnode: VNode) => {
                emitSelection(state, vnode.elm as HTMLInputElement, emit);
            },
            scroll: (_event: MouseEvent, vnode: VNode) => {
                emitSelection(state, vnode.elm as HTMLInputElement, emit);
            },
            focus: (_event: Event, vnode: VNode) => {
                setSelection(vnode.elm as HTMLInputElement, state.selection);
            },
            input: (_, vnode) => {
                emit({ $: 'change', _: (vnode.elm as HTMLInputElement).value });
                emitSelection(state, vnode.elm as HTMLInputElement, emit);
            },
        }
    });
}

function getSelection(elm: HTMLInputElement): Selection {
    const { selectionStart, selectionEnd } = elm;
    return selectionStart == selectionEnd ?
        a(selectionStart as number) :
        b([selectionStart, selectionEnd] as [number, number]);
}

function emitSelection(_state: State, node: HTMLInputElement, emit: Emit<Signal>) {
    emit(keyed('select', getSelection(node)));
}

function setSelection(elm: HTMLInputElement, sel: Selection) {
    elm.selectionStart = sel.$ ? sel._[0] : sel._;
    elm.selectionEnd = sel.$ ? sel._[1] : sel._;
}

function startSelection(sel: Selection): number {
    return sel.$ ? sel._[0] : sel._;
}

function endSelection(sel: Selection): number {
    return sel.$ ? sel._[1] : sel._;
}
