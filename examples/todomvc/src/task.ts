import { Emit, AsKeyed, keyed } from '@literium/base';
import { VNode, KeyCode, h } from '@literium/core';
import { JSType, dict, str, bin } from '@literium/json';

export const json = dict({
    content: str,
    completed: bin,
});

export type Data = JSType<typeof json>;

export interface State extends Data {
    editing: boolean;
}

export const enum Op {
    Edit,
    Change,
    Complete,
    Remove,
}

export type Signal = AsKeyed<{
    [Op.Edit]: boolean;
    [Op.Change]: string;
    [Op.Complete]: boolean;
    [Op.Remove]: void;
}>;

export function create() {
    return {
        content: '',
        completed: false,
        editing: false,
    };
}

export function load({ content, completed }: Data): State {
    return { content, completed, editing: false };
}

export function save({ content, completed }: State): Data {
    return { content, completed };
}

export function update(state: State, signal: Signal) {
    switch (signal.$) {
        case Op.Edit:
            return {
                ...state,
                editing: signal._
            };
        case Op.Change:
            return {
                ...state,
                content: signal._
            };
        case Op.Complete:
            return {
                ...state,
                completed: signal._
            };
        default:
            return state;
    }
}

export function render({ content, completed, editing }: State, emit: Emit<Signal>): VNode {
    return h('li', {
        class: {
            completed,
            editing
        }
    }, [
            h('div.view', [
                h('input.toggle', {
                    attrs: {
                        type: 'checkbox',
                        checked: completed
                    },
                    props: {
                        checked: completed,
                    },
                    on: {
                        change: () => { emit(keyed(Op.Complete, !completed)); },
                    },
                }),
                h('label', { on: { dblclick: () => { emit(keyed(Op.Edit, true)); } } }, content),
                h('button.destroy', { on: { click: () => { emit(keyed(Op.Remove, undefined)); } } }),
            ]),
            h('input.edit', {
                attrs: { value: content },
                hook: {
                    update: (_, vnode) => {
                        if (editing) {
                            const input = vnode.elm as HTMLInputElement;
                            input.focus();
                            input.selectionStart = input.selectionEnd = input.value.length;
                        }
                    }
                },
                on: {
                    blur: () => { emit(keyed(Op.Edit, false)); },
                    change: e => { emit(keyed(Op.Change, (e.target as HTMLInputElement).value)); },
                    keydown: e => {
                        if (e.keyCode == KeyCode.Enter || e.keyCode == KeyCode.Escape) {
                            emit(keyed(Op.Edit, false));
                        } else {
                            emit(keyed(Op.Change, (e.target as HTMLInputElement).value));
                        }
                    },
                }
            })
        ]);
}
