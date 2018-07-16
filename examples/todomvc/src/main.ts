import { VNode, Emit, Component, Keyed, h, page, key_emit } from 'literium';
import * as Todo from './todo';
//import * as Json from 'literium-json';
import { nat, str, bin, dict, list } from 'literium-json';
import { StoreType, initStore, loadStore, moveStore, saveStore } from 'literium-runner';

const styles = [{ link: `client_${process.env.npm_package_version}.min.css` }];
const scripts = [{ link: `client_${process.env.npm_package_version}.min.js` }];
const settings = {
    viewport: "width=device-width, initial-scale=1"
};

export interface State {
    todo: Todo.State;
}

export type Signal
    = Keyed<'todo', Todo.Signal>;

const store = initStore('todo', dict({
    tasks: list(dict({
        content: str,
        completed: bin,
    })),
    filter: nat
}), Todo.save(Todo.create()));

function create() {
    const todo = Todo.load(loadStore(store));
    return { todo };
}

function update(state: State, signal: Signal) {
    switch (signal.$) {
        case 'todo':
            const todo = Todo.update(state.todo, signal._);
            moveStore(store, StoreType.Persist);
            saveStore(store, Todo.save(todo));
            return { ...state, todo };
    }
    return state;
}

function render(state: State, emit: Emit<Signal>) {
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

export const main: Component<State, Signal> = { create, update, render };

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
