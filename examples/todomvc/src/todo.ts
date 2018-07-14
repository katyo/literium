import { h, with_key, KeyCode, Keyed, keyed, Patch } from 'literium';
import * as Task from './task';

export const enum Filter {
    All,
    Active,
    Completed,
}

export interface Data {
    tasks: Task.Data[];
    filter: Filter;
}

export interface State {
    tasks: Keyed<number, Task.Task>[];
    filter: Filter;
}

export type Todo = ReturnType<typeof todo>;

export function todo(patch: Patch, props: { change: () => void }) {
    let lastKey = 0;

    const todo = {
        state: <State>{
            tasks: [],
            filter: Filter.All,
        },

        ...props,

        load: patch(({ tasks, filter }: Data) => {
            lastKey = 0;
            todo.state = { tasks: [], filter };
            for (const task_data of tasks) {
                const task = ($ => keyed($, Task.task(patch, {
                    remove: () => { todo.remove_task($); }
                })))(++lastKey);
                task._.load(task_data);
                todo.state.tasks.push(task);
            }
        }),

        save: () => ({
            tasks: todo.state.tasks.map(({ _ }) => _.save()),
            filter: todo.state.filter
        }),

        remove_task: patch(($$: number) => {
            todo.state.tasks = todo.state.tasks.filter(({ $ }) => $ != $$);
        }),

        add: patch((content: string) => {
            ++lastKey;
            const task = Task.task(patch, { remove: () => { todo.remove_task(lastKey); } });
            task.change({ content });
            todo.state.tasks.unshift(keyed(lastKey, task));
        }),

        complete: patch(() => {
            const incomplete = todo.state.tasks.filter(({ _ }) => !_.state.completed);
            for (const { _: task } of todo.state.tasks) {
                task.change({ completed: !!incomplete.length });
            }
        }),

        change: patch((state: Partial<State>) => {
            todo.state = { ...todo.state, ...state };
        }),

        remove: patch(() => {
            todo.state.tasks = todo.state.tasks.filter(({ _ }) => !_.state.completed);
        }),

        render: () => {
            const { filter, tasks } = todo.state;
            const incomplete = tasks.filter(({ _ }) => !_.state.completed);

            return h('section.todoapp', [
                h('header.header', [
                    h('h1', 'todos'),
                    h('input.new-todo', {
                        attrs: { placeholder: "What needs to be done?", autofocus: true },
                        on: {
                            keydown: e => {
                                const input = e.target as HTMLInputElement;
                                if (input.value != '' && e.keyCode == KeyCode.Enter) {
                                    todo.add(input.value);
                                    input.value = '';
                                }
                            }
                        }
                    })
                ]),
                ...(tasks.length ? [
                    h('!', "This section should be hidden by default and shown when there are todos"),
                    h('section.main', [
                        h('input#toggle-all.toggle-all', {
                            attrs: { type: "checkbox", checked: !incomplete.length }, props: { checked: !incomplete.length }, on: {
                                click: () => { todo.complete(); }
                            }
                        }),
                        h('label', { attrs: { for: "toggle-all" } }, "Mark all as complete"),
                        h('ul.todo-list', [
                            h('!', "These are here just to show the structure of the list items"),
                            h('!', "List items should get the class `editing` when editing and`completed` when marked as completed"),
                            ...tasks
                                .filter(({ $, _ }) => filter == Filter.Active ? !_.state.completed :
                                    filter == Filter.Completed ? _.state.completed : true)
                                .map(({ $, _ }) => with_key($, _.render()))
                        ]),
                    ]),
                    h('!', "This footer should hidden by default and shown when there are todos"),
                    h('footer.footer', [
                        h('!', "This should be`0 items left` by default"),
                        h('span.todo-count', [h('strong', incomplete.length), ` item${incomplete.length == 1 ? 's' : ''} left`]),
                        h('!', "Remove this if you don't implement routing"),
                        h('ul.filters', [
                            h('li', h('a', {
                                class: { selected: filter == Filter.All }, attrs: { href: "#/" }, on: {
                                    click: () => { todo.change({ filter: Filter.All }); }
                                }
                            }, "All")),
                            h('li', h('a', {
                                class: { selected: filter == Filter.Active }, attrs: { href: "#/active" }, on: {
                                    click: () => { todo.change({ filter: Filter.Active }); }
                                }
                            }, "Active")),
                            h('li', h('a', {
                                class: { selected: filter == Filter.Completed }, attrs: { href: "#/completed" }, on: {
                                    click: () => { todo.change({ filter: Filter.Completed }); }
                                }
                            }, "Completed")),
                        ]),
                        h('!', "Hidden if no completed items are left ↓"),
                        ...(tasks.length > incomplete.length ? [
                            h('button.clear-completed', {
                                on: {
                                    click: () => { todo.remove(); }
                                }
                            }, `Clear completed (${tasks.length - incomplete.length})`)
                        ] : []),
                    ])
                ] : [])
            ]);
        }
    };

    return todo;
}
