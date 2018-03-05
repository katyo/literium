import { Send, Fork, Component, h, fork_map, send_map } from 'literium/types';
import { page } from 'literium/page';
import { todo as todoComponent, State as TodoState, Event as TodoEvent } from './todo';

const styles = [{ link: `client_${process.env.npm_package_version}.min.css` }];
const scripts = [{ link: `client_${process.env.npm_package_version}.min.js` }];

export interface FromTodo {
    type: 'todo';
    event: TodoEvent;
}

function wrapTodo(event: TodoEvent): Event {
    return { type: 'todo', event };
}

export type Event = FromTodo;

export interface State {
    todo: TodoState;
}

function create(fork: Fork<Event>) {
    return {
        todo: todoComponent.create(fork_map(fork, wrapTodo))
    };
}

function update(state: State, event: Event, fork: Fork<Event>) {
    switch (event.type) {
        case 'todo':
            return {
                ...state,
                todo: todoComponent.update(state.todo, event.event, fork_map(fork, wrapTodo))
            };
    }
    return state;
}

function render(state: State, send: Send<Event>) {
    return page({
        styles,
        scripts,
        title: "TodoMVC",
    }, [
            todoComponent.render(state.todo, send_map(send, wrapTodo)),
            h('footer.info', [
                h('p', 'Double-click to edit a todo'),
                h('p', [
                    'Created by ',
                    h('a', { attrs: { href: 'https://github.com/katyo' } }, 'Kayo'),
                ]),
                h('p', [
                    'Not a part of ',
                    h('a', { attrs: { href: 'http://todomvc.com' } }, 'TodoMVC'),
                    ' yet now.'
                ]),
            ]),
        ]);
}

export const main: Component<State, Event> = { create, update, render };
