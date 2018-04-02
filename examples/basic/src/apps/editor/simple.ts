import { VNode, Send, either_a, either_b, h, keyed } from 'literium';
import { State, Event, Selection } from './common';

export function render(state: State, send: Send<Event>): VNode {
    return h('textarea', {
        props: {
            value: state.content,
            selectionStart: startSelection(state.selection),
            selectionEnd: endSelection(state.selection),
        },
        on: {
            click: (event: MouseEvent, vnode: VNode) => {
                sendSelection(state, vnode.elm as HTMLInputElement, send);
            },
            scroll: (event: MouseEvent, vnode: VNode) => {
                sendSelection(state, vnode.elm as HTMLInputElement, send);
            },
            focus: (event, vnode: VNode) => {
                setSelection(vnode.elm as HTMLInputElement, state.selection);
            },
            input: (_, vnode) => {
                send({ $: 'change', _: (vnode.elm as HTMLInputElement).value });
                sendSelection(state, vnode.elm as HTMLInputElement, send);
            },
        }
    });
}

function getSelection(elm: HTMLInputElement): Selection {
    const { selectionStart, selectionEnd } = elm;
    return selectionStart == selectionEnd ?
        either_a(selectionStart as number) :
        either_b([selectionStart, selectionEnd] as [number, number]);
}

function sendSelection(state: State, node: HTMLInputElement, send: Send<Event>) {
    send(keyed('select' as 'select', getSelection(node)));
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
