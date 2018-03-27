import { VNode, VNodeChildren, Component, Send, h, Keyed, vnode_log, bench } from 'literium';
import { initMarkup, gfm_tables_breaks, vdomRender } from 'literium-markup';
import { highlightVDomRender } from './highlight';

import example_md from './sample.md';

const benchmark = bench();

const renderMarkup = initMarkup(gfm_tables_breaks, highlightVDomRender(vdomRender));

export interface State {
    source: string;
    markup: VNodeChildren;
    gentime: number;
    scroll: number;
};

export type Event = Keyed<'input', string> | Keyed<'scroll', number>;

function create(): State {
    const source = example_md;
    const bench_markup = benchmark.run();
    const markup = renderMarkup(source);

    return {
        source,
        markup,
        gentime: bench_markup(),
        scroll: 0,
    };
}

function update(state: State, event: Event): State {
    console.log(event);
    switch (event.$) {
        case 'input': {
            const source = event._;
            const bench_markup = benchmark.run();
            const markup = renderMarkup(source);
            return {
                ...state,
                source,
                markup, gentime: bench_markup()
            };
        }
        case 'scroll': return { ...state, scroll: event._ };
    }
    return state;
}

function getScrollHeight(elm: HTMLElement): number {
    return elm.scrollTop / (elm.scrollHeight - elm.clientHeight);
}

function setScrollHeight(elm: HTMLElement, scroll: number) {
    elm.scrollTop = Math.round(scroll * (elm.scrollHeight - elm.clientHeight));
}

function render(state: State, send: Send<Event>): VNode {
    return vnode_log(h('div.wrapper-small', [
        h('div', h('label', { class: { textfield: true } }, [
            h('textarea', {
                attrs: { rows: 8 }, props: { value: state.source },
                hook: { update: (_, vnode) => { setScrollHeight(vnode.elm as HTMLElement, state.scroll); } },
                on: {
                    input: e => { send({ $: 'input', _: (e.target as HTMLInputElement).value }); },
                    scroll: e => { send({ $: 'scroll', _: getScrollHeight(e.target as HTMLElement) }); },
                }
            }),
            //h('span', { class: { textfield__label: true } }, `Markdown source (${state.gentime.toPrecision(3)} mS, ${(1000 / state.gentime).toPrecision(3)} FPS)`)
        ])),
        h('span', `Preview (${state.gentime.toPrecision(3)} mS, ${(1000 / state.gentime).toPrecision(3)} FPS)`),
        h('div.markup-preview', {
            style: { height: '250px' },
            hook: { update: (_, vnode) => { setScrollHeight(vnode.elm as HTMLElement, state.scroll); } },
            on: { scroll: e => { send({ $: 'scroll', _: getScrollHeight(e.target as HTMLElement) }); } },
        }, state.markup),
    ]));
}

const app: Component<State, Event> = { create, update, render };

export default app;
