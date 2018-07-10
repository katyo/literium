import { VNode, Emit, h, KeyCode, Keyed, keyed } from 'literium';

export interface Data {
    content: string;
    completed: boolean;
}

export interface State extends Data {
    editing: boolean;
}

export type Signal
    = Keyed<'edit', boolean>
    | Keyed<'change', string>
    | Keyed<'complete', boolean>
    | Keyed<'remove', void>;

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
        case 'edit':
            return {
                ...state,
                editing: signal._
            };
        case 'change':
            return {
                ...state,
                content: signal._
            };
        case 'complete':
            return {
                ...state,
                completed: signal._
            };
        default:
            return state;
    }
}

export function render(state: State, emit: Emit<Signal>): VNode {
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
                        change: () => { emit(keyed('complete' as 'complete', !completed)); },
                    },
                }),
                h('label', { on: { dblclick: () => { emit(keyed('edit' as 'edit', true)); } } }, content),
                h('button.destroy', { on: { click: () => { emit(keyed('remove' as 'remove', undefined)); } } }),
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
                    blur: () => { emit(keyed('edit' as 'edit', false)); },
                    change: e => { emit(keyed('change' as 'change', (e.target as HTMLInputElement).value)); },
                    keydown: e => {
                        if (e.keyCode == KeyCode.Enter || e.keyCode == KeyCode.Escape) {
                            emit(keyed('edit' as 'edit', false));
                        } else {
                            emit(keyed('change' as 'change', (e.target as HTMLInputElement).value));
                        }
                    },
                }
            })
        ]);
}
