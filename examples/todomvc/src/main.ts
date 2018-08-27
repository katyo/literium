import { Emit, Keyed, key_emit } from '@literium/base';
import { VNode, Component, h, page } from '@literium/core';
import * as Todo from './todo';
import { StoreCell, StoreType, initStore, loadStore, moveStore, saveStore } from '@literium/runner';

const styles = [{ link: `client_${process.env.npm_package_version}.min.css` }];
const scripts = [{ link: `client_${process.env.npm_package_version}.min.js` }];
const settings = {
    viewport: "width=device-width, initial-scale=1"
};

export interface Props {
    store: string;
}

export interface State {
    store: StoreCell<Todo.Data>;
    todo: Todo.State;
}

export type Signal
    = Keyed<'todo', Todo.Signal>;

function create({ store: name }: Props) {
    const store = initStore(name, Todo.json, Todo.save(Todo.create()));
    const todo = Todo.load(loadStore(store));
    return { store, todo };
}

function update(props: Props, state: State, signal: Signal) {
    switch (signal.$) {
        case 'todo':
            const todo = Todo.update(state.todo, signal._);
            moveStore(state.store, StoreType.Persist);
            saveStore(state.store, Todo.save(todo));
            return { ...state, todo };
    }
    return state;
}

function render(props: Props, state: State, emit: Emit<Signal>) {
    return page({
        styles,
        scripts,
        settings,
        title: "TodoMVC",
        body: { class: { 'learn-bar': true } },
    }, [
            learn(),
            Todo.render(state.todo, key_emit(emit, 'todo')),
            footer(),
        ]);
}

export const main: Component<Props, State, Signal> = { create, update, render };

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
                url: 'https://github.com/katyo/literium/tree/master/examples/todomvc',
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
            h('p', 'Literium is an ultra-light client-side framework for modern Web-application. Its core principles are explicit state, controllable behavior, declarative code, efficiency, simplicity and flexibility.'),
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
