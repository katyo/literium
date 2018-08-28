import { Emit, Keyed, AsKeyed, keyed, key_emit } from '@literium/base';
import { VNode, h, with_key, KeyCode } from '@literium/core';
import * as Task from './task';
import { JSType, dict, list, nat } from '@literium/json';

export const enum Filter {
    All,
    Active,
    Completed,
}

export const json = dict({
    tasks: list(Task.json),
    filter: nat,
});

export type Data = JSType<typeof json>;

export interface State {
    tasks: Keyed<number, Task.State>[];
    lastKey: number;
    filter: Filter;
}

export const enum Op {
    Add,
    Complete,
    Filter,
    Remove,
    Task,
}

export type Signal = AsKeyed<{
    [Op.Add]: string;
    [Op.Complete]: void;
    [Op.Filter]: Filter;
    [Op.Remove]: void;
    [Op.Task]: Keyed<number, Task.Signal>;
}>;

const wrap_task_emit = key_emit(Op.Task);

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
        case Op.Task:
            if (signal._._.$ == Task.Op.Remove) {
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
        case Op.Add:
            ++lastKey;
            const task = {
                $: lastKey,
                _: Task.update(Task.create(),
                    keyed(Task.Op.Change, signal._))
            };
            return { ...state, tasks: [task, ...tasks], lastKey };
        case Op.Complete:
            const incomplete = tasks.filter(task => !task._.completed);
            return {
                ...state,
                tasks: tasks.map(task => ({
                    $: task.$, _: Task.update(task._, keyed(Task.Op.Complete, !!incomplete.length))
                }))
            };
        case Op.Filter:
            return { ...state, filter: signal._ };
        case Op.Remove:
            return { ...state, tasks: tasks.filter(task => !task._.completed) };
    }
    return state;
}

export function render(state: State, emit: Emit<Signal>): VNode {
    const { filter, tasks } = state;
    const task_emit = key_emit(wrap_task_emit(emit));
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
                            emit(keyed(Op.Add, input.value));
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
                        click: () => { emit(keyed(Op.Complete, undefined)); }
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
                            task_emit(task.$))))
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
                            click: () => { emit(keyed(Op.Filter, Filter.All)); }
                        }
                    }, "All")),
                    h('li', h('a', {
                        class: { selected: filter == Filter.Active }, attrs: { href: "#/active" }, on: {
                            click: () => { emit(keyed(Op.Filter, Filter.Active)); }
                        }
                    }, "Active")),
                    h('li', h('a', {
                        class: { selected: filter == Filter.Completed }, attrs: { href: "#/completed" }, on: {
                            click: () => { emit(keyed(Op.Filter, Filter.Completed)); }
                        }
                    }, "Completed")),
                ]),
                h('!', "Hidden if no completed items are left ↓"),
                ...(tasks.length > incomplete.length ? [
                    h('button.clear-completed', {
                        on: {
                            click: () => { emit(keyed(Op.Remove, undefined)); }
                        }
                    }, `Clear completed (${tasks.length - incomplete.length})`)
                ] : []),
            ])
        ] : [])
    ]);
}
