import { VNode, Send, h } from 'literium/types';
import { KeyCode } from 'literium/keys';

export interface Data {
    content: string;
    completed: boolean;
}

export interface State extends Data {
    editing: boolean;
}

export interface SetEditing {
    type: 'edit';
    state: boolean;
}

export interface EditContent {
    type: 'change';
    content: string;
}

export interface SetCompleted {
    type: 'complete';
    state: boolean;
}

export interface Remove {
    type: 'remove';
}

export type Event = SetEditing | EditContent | SetCompleted | Remove;

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

export function update(state: State, event: Event) {
    switch (event.type) {
        case 'edit':
            return {
                ...state,
                editing: event.state
            };
        case 'change':
            return {
                ...state,
                content: event.content
            };
        case 'complete':
            return {
                ...state,
                completed: event.state
            };
        default:
            return state;
    }
}

export function render(state: State, send: Send<Event>): VNode {
    const { content, completed, editing } = state;
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
                        change: () => { send({ type: 'complete', state: !completed }); },
                    },
                }),
                h('label', { on: { dblclick: () => { send({ type: 'edit', state: true }); } } }, content),
                h('button.destroy', { on: { click: () => { send({ type: 'remove' }); } } }),
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
                    blur: () => { send({ type: 'edit', state: false }); },
                    change: e => { send({ type: 'change', content: (e.target as HTMLInputElement).value }); },
                    keydown: e => {
                        if (e.keyCode == KeyCode.Enter || e.keyCode == KeyCode.Escape) {
                            send({ type: 'edit', state: false });
                        } else {
                            send({ type: 'change', content: (e.target as HTMLInputElement).value });
                        }
                    },
                }
            })
        ]);
}
