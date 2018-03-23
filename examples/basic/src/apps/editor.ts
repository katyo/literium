import { VNode, Component, Send, h, Keyed, vnode_log, bench } from 'literium';
import * as Markup from 'literium-markup';

import example_md from './sample.md';

const benchmark = bench();

export interface State {
    source: string;
    markup: Markup.State;
    gentime: number;
};

export type Event = Keyed<'markup', Markup.Event> | Keyed<'input', string>;

const options = {
    pedantic: true,
    smartLists: true,
    smartypants: true,
    sanitize: true,
};

function create(): State {
    const source = example_md;
    const bench_markup = benchmark.run();
    const markup = Markup.update(Markup.create(Markup.normal, Markup.vdomRender, options), { $: 'update', _: source });

    return {
        source,
        markup,
        gentime: bench_markup(),
    };
}

function update(state: State, event: Event): State {
    console.log(event);
    switch (event.$) {
        case 'markup': return { ...state, markup: Markup.update(state.markup, event._) };
        case 'input': {
            const source = event._;
            const bench_markup = benchmark.run();
            const markup = Markup.update(state.markup, { $: 'update', _: source });
            return { ...state, source, markup, gentime: bench_markup() };
        }
    }
    return state;
}

function render(state: State, send: Send<Event>): VNode {
    return vnode_log(h('div.wrapper-small.grid.grid-large', [
        h('div', Markup.render(state.markup)),
        h('div', h('label', { class: { textfield: true } }, [
            h('textarea', {
                attrs: { rows: 15 }, props: { value: state.source },
                on: { input: e => { send({ $: 'input', _: (e.target as HTMLInputElement).value }); } }
            }),
            h('span', { class: { textfield__label: true } }, `Markdown source (${state.gentime.toPrecision(3)} mS, ${(1000 / state.gentime).toPrecision(3)} FPS)`)
        ]))
    ]));
}

const app: Component<State, Event> = { create, update, render };

export default app;
