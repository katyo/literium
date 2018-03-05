import { Component, Send, Fork, Keyed, h, fork_map, send_map, with_key } from 'literium/types';
import { KeyCode } from 'literium/keys';
import { State as TaskState, Event as TaskEvent, task as taskComponent } from './task';

export const enum Filter {
    All,
    Active,
    Completed,
}

export interface State {
    tasks: Keyed<number, TaskState>[];
    lastKey: number;
    filter: Filter;
}

export interface WithTask {
    type: 'task';
    event: Keyed<number, TaskEvent>;
}

function withTask($: number): (value: TaskEvent) => Event {
    return (_: TaskEvent) => ({
        type: 'task',
        event: { $, _ }
    });
}

export interface AddTask {
    type: 'add';
    content: string;
}

export interface CompleteAll {
    type: 'complete';
}

export interface SetFilter {
    type: 'filter';
    filter: Filter;
}

export interface RemoveCompleted {
    type: 'remove';
}

export type Event = WithTask | AddTask | CompleteAll | SetFilter | RemoveCompleted;

function create() {
    return {
        tasks: [],
        lastKey: 0,
        filter: Filter.All,
    };
}

function update(state: State, event: Event, fork: Fork<Event>) {
    let { lastKey, tasks } = state;
    switch (event.type) {
        case 'task':
            if (event.event._.type == 'remove') {
                return {
                    ...state,
                    tasks: tasks.filter(task => task.$ != event.event.$)
                };
            } else {
                return {
                    ...state,
                    tasks: tasks.map(task => task.$ == event.event.$ ?
                        {
                            $: task.$,
                            _: taskComponent.update(task._, event.event._,
                                fork_map(fork, withTask(task.$)))
                        } : task)
                };
            }
        case 'add':
            ++lastKey;
            const task_fork = fork_map(fork, withTask(lastKey));
            const task = {
                $: lastKey,
                _: taskComponent.update(taskComponent.create(task_fork),
                    { type: 'change', content: event.content }, task_fork)
            };
            return { ...state, tasks: [task, ...tasks], lastKey };
        case 'complete':
            const incomplete = tasks.filter(task => !task._.completed);
            return {
                ...state,
                tasks: tasks.map(task => ({
                    $: task.$, _: taskComponent.update(task._, { type: 'complete', state: !!incomplete.length },
                        fork_map(fork, withTask(task.$)))
                }))
            };
        case 'filter':
            return { ...state, filter: event.filter };
        case 'remove':
            return { ...state, tasks: tasks.filter(task => !task._.completed) };
    }
    return state;
}

function render(state: State, send: Send<Event>) {
    const { filter, tasks } = state;
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
                            send({
                                type: 'add',
                                content: input.value
                            });
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
                        click: () => { send({ type: 'complete' }); }
                    }
                }),
                h('label', { attrs: { for: "toggle-all" } }, "Mark all as complete"),
                h('ul.todo-list', [
                    h('!', "These are here just to show the structure of the list items"),
                    h('!', "List items should get the class `editing` when editing and`completed` when marked as completed"),
                    ...tasks
                        .filter(task => filter == Filter.Active ? !task._.completed :
                            filter == Filter.Completed ? task._.completed : true)
                        .map(task => with_key(task.$, taskComponent.render(task._,
                            send_map(send, withTask(task.$)))))
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
                            click: () => { send({ type: 'filter', filter: Filter.All }); }
                        }
                    }, "All")),
                    h('li', h('a', {
                        class: { selected: filter == Filter.Active }, attrs: { href: "#/active" }, on: {
                            click: () => { send({ type: 'filter', filter: Filter.Active }); }
                        }
                    }, "Active")),
                    h('li', h('a', {
                        class: { selected: filter == Filter.Completed }, attrs: { href: "#/completed" }, on: {
                            click: () => { send({ type: 'filter', filter: Filter.Completed }); }
                        }
                    }, "Completed")),
                ]),
                h('!', "Hidden if no completed items are left ↓"),
                ...(tasks.length > incomplete.length ? [
                    h('button.clear-completed', {
                        on: {
                            click: () => { send({ type: 'remove' }); }
                        }
                    }, `Clear completed (${tasks.length - incomplete.length})`)
                ] : []),
            ])
        ] : [])
    ]);
}

export const todo: Component<State, Event> = { create, update, render };
