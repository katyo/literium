import { h, KeyCode, Patch } from 'literium';

export interface Data {
    content: string;
    completed: boolean;
}

export interface State extends Data {
    editing: boolean;
}

export type Task = ReturnType<typeof task>;

export function task(patch: Patch, props: { remove: () => void }) {
    const task = {
        state: <State>{
            content: '',
            completed: false,
            editing: false,
        },

        ...props,

        load: patch((data: Data) => {
            task.state = {
                ...data,
                editing: false
            };
        }),

        save: (): Data => {
            const { content, completed } = task.state;
            return { content, completed };
        },

        change: patch((state: Partial<State>) => {
            task.state = { ...task.state, ...state };
        }),

        render: () => {
            const { content, completed, editing } = task.state;
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
                                change: () => { task.change({ completed: !completed }); },
                            },
                        }),
                        h('label', { on: { dblclick: () => { task.change({ editing: true }); } } }, content),
                        h('button.destroy', { on: { click: () => { task.remove(); } } }),
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
                            blur: () => { task.change({ editing: false }); },
                            change: e => { task.change({ content: (e.target as HTMLInputElement).value }); },
                            keydown: e => {
                                if (e.keyCode == KeyCode.Enter || e.keyCode == KeyCode.Escape) {
                                    task.change({ editing: false });
                                } else {
                                    task.change({ content: (e.target as HTMLInputElement).value });
                                }
                            },
                        }
                    })
                ]);
        }
    };

    return task;
}
