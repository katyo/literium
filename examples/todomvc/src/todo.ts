import { VNode, Emit, h, with_key, KeyCode, Keyed, keyed, key_emit } from 'literium';
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
    tasks: Keyed<number, Task.State>[];
    lastKey: number;
    filter: Filter;
}

export type Signal
    = Keyed<'add', string>
    | Keyed<'complete', void>
    | Keyed<'filter', Filter>
    | Keyed<'remove', void>
    | Keyed<'task', Keyed<number, Task.Signal>>
    ;

export function create() {
    return {
        tasks: [],
        lastKey: 0,
        filter: Filter.All,
    };
}

export function load({ tasks: tasks_, filter }: Data): State {
    let lastKey = 0;
    const tasks = tasks_.map(task => ({ $: lastKey++, _: Task.load(task) }));
    return { tasks, lastKey, filter };
}

export function save({ tasks, filter }: State): Data {
    return { tasks: tasks.map(task => Task.save(task._)), filter };
}

export function update(state: State, signal: Signal) {
    let { lastKey, tasks } = state;
    switch (signal.$) {
        case 'task':
            if (signal._._.$ == 'remove') {
                return {
                    ...state,
                    tasks: tasks.filter(task => task.$ != signal._.$)
                };
            } else {
                return {
                    ...state,
                    tasks: tasks.map(task => task.$ == signal._.$ ?
                        {
                            $: task.$,
                            _: Task.update(task._, signal._._)
                        } : task)
                };
            }
        case 'add':
            ++lastKey;
            const task = {
                $: lastKey,
                _: Task.update(Task.create(),
                    keyed('change' as 'change', signal._))
            };
            return { ...state, tasks: [task, ...tasks], lastKey };
        case 'complete':
            const incomplete = tasks.filter(task => !task._.completed);
            return {
                ...state,
                tasks: tasks.map(task => ({
                    $: task.$, _: Task.update(task._, keyed('complete' as 'complete', !!incomplete.length))
                }))
            };
        case 'filter':
            return { ...state, filter: signal._ };
        case 'remove':
            return { ...state, tasks: tasks.filter(task => !task._.completed) };
    }
    return state;
}

export function render(state: State, emit: Emit<Signal>): VNode {
    const { filter, tasks } = state;
    const task_emit = key_emit(emit, 'task');
    const incomplete = tasks.filter(task => !task._.completed);

    return h('section.todoapp', [
        h('header.header', [
            h('h1', 'todos'),
            h('input.new-todo', {
                attrs: { placeholder: "What needs to be done?", autofocus: true },
                on: {
                    keydown: e => {
                        const input = e.target as HTMLInputElement;
                        if (input.value != '' && e.keyCode == KeyCode.Enter) {
                            emit(keyed('add', input.value));
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
                        click: () => { emit(keyed('complete', undefined)); }
                    }
                }),
                h('label', { attrs: { for: "toggle-all" } }, "Mark all as complete"),
                h('ul.todo-list', [
                    h('!', "These are here just to show the structure of the list items"),
                    h('!', "List items should get the class `editing` when editing and`completed` when marked as completed"),
                    ...tasks
                        .filter(task => filter == Filter.Active ? !task._.completed :
                            filter == Filter.Completed ? task._.completed : true)
                        .map(task => with_key(task.$, Task.render(task._,
                            key_emit(task_emit, task.$))))
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
                            click: () => { emit(keyed('filter', Filter.All)); }
                        }
                    }, "All")),
                    h('li', h('a', {
                        class: { selected: filter == Filter.Active }, attrs: { href: "#/active" }, on: {
                            click: () => { emit(keyed('filter', Filter.Active)); }
                        }
                    }, "Active")),
                    h('li', h('a', {
                        class: { selected: filter == Filter.Completed }, attrs: { href: "#/completed" }, on: {
                            click: () => { emit(keyed('filter', Filter.Completed)); }
                        }
                    }, "Completed")),
                ]),
                h('!', "Hidden if no completed items are left ↓"),
                ...(tasks.length > incomplete.length ? [
                    h('button.clear-completed', {
                        on: {
                            click: () => { emit(keyed('remove', undefined)); }
                        }
                    }, `Clear completed (${tasks.length - incomplete.length})`)
                ] : []),
            ])
        ] : [])
    ]);
}
