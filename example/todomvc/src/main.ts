import { VNode, Send, Fork, Component, h, fork_map, send_map } from 'literium/types';
import { page } from 'literium/page';
import { todo as todoComponent, State as TodoState, Event as TodoEvent } from './todo';
import { load, save } from 'literium/store';

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
    const todo = load<TodoState>('todo') || todoComponent.create(fork_map(fork, wrapTodo));
    return { todo };
}

function update(state: State, event: Event, fork: Fork<Event>) {
    switch (event.type) {
        case 'todo':
            const todo = todoComponent.update(state.todo, event.event, fork_map(fork, wrapTodo));
            save('todo', todo);
            return { ...state, todo };
    }
    return state;
}

function render(state: State, send: Send<Event>) {
    return page({
        styles,
        scripts,
        title: "TodoMVC",
        body: { class: { 'learn-bar': true } },
    }, [
            learn(),
            todoComponent.render(state.todo, send_map(send, wrapTodo)),
            footer(),
        ]);
}

export const main: Component<State, Event> = { create, update, render };

interface SourceLink {
    title: string;
    url: string;
    local?: true;
    kind?: string;
}

interface SourceLinksGroup {
    title: string;
    links: SourceLink[];
}

const source_links: SourceLinksGroup[] = [
    {
        title: 'Example',
        links: [
            {
                title: 'Source',
                url: 'https://github.com/katyo/literium/tree/master/example/todomvc',
            }
        ]
    }
];

function learn() {
    return h('aside.learn', [
        h('header', [
            h('h3', 'Literium'),
            h('span.source-links',
                source_links.reduce((list, { title, links }) => (list.push(h('h5', title)),
                    links.forEach(({ title, url, kind, local }) => {
                        if ((list[list.length - 1] as VNode).sel == 'a') list.push(', ');
                        list.push(h('a' + (kind ? `.${kind}-link` : ''), {
                            attrs: {
                                href: url,
                                'data-type': local ? 'local' : false
                            }
                        }, title));
                    }), list), [] as (VNode | string)[]))
        ]),
        h('hr'),
        h('blockquote.quote.speech-bubble', [
            h('p', 'Literium is a client-side framework for modern Web-application. Its core principles are explicit state, controllable behavior, declarative code, effeciency, simplicity and flexibility.'),
        ]),
        h('footer', [
            h('hr'),
            h('em', [
                'If you found unexpected behavior in example, or you have something helpful ideas, please ',
                h('a', { attrs: { href: 'https://github.com/katyo/literium/issues' } }, 'let me know'),
                '.'
            ])
        ])
    ]);
}

function footer() {
    return h('footer.info', [
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
    ]);
}
