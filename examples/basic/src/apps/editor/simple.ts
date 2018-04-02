import { VNode, Send, either_a, either_b, h } from 'literium';
import { State, Event, Selection } from './common';

export function render(state: State, send: Send<Event>): VNode {
    return h('textarea', {
        //attrs: { rows: 8 },
        props: {
            value: state.content,
            selectionStart: startSelection(state.selection),
            selectionEnd: endSelection(state.selection),
        },
        on: {
            input: (_, vnode) => {
                send({ $: 'change', _: (vnode.elm as HTMLInputElement).value });
                send({ $: 'select', _: getSelection(vnode.elm as HTMLInputElement) });
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

function startSelection(sel: Selection): number {
    return sel.$ ? sel._[0] : sel._;
}

function endSelection(sel: Selection): number {
    return sel.$ ? sel._[1] : sel._;
}
