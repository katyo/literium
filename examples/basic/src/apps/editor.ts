import { VNode, VData, VNodeChildren, Component, Send, h, Keyed, keyed, send_wrap, vnode_log, bench } from 'literium';
import { initMarkup, gfm_tables_breaks, vdomRender } from 'literium-markup';
import { highlightVDomRender } from './editor/highlight';
import * as Editor from './editor/common';
import * as SimpleEditor from './editor/simple';
import * as AdvancedEditor from './editor/advanced';

import example_md from './sample.md';

const benchmark = bench();

const renderMarkup = initMarkup(gfm_tables_breaks, highlightVDomRender(vdomRender));

export interface State {
    editor: Editor.State;
    advanced: boolean;
    markup: VNodeChildren;
    gentime: number;
    scroll: number;
};

export type Event = Keyed<'editor', Editor.Event> | Keyed<'scroll', number> | Keyed<'set-advanced', boolean>;

function create(): State {
    const source = example_md;
    const bench_markup = benchmark.run();
    const markup = renderMarkup(source);

    return {
        editor: Editor.update(Editor.create(), keyed('change' as 'change', source)),
        advanced: false,
        markup,
        gentime: bench_markup(),
        scroll: 0,
    };
}

function update(state: State, event: Event): State {
    console.log(event);
    switch (event.$) {
        case 'editor':
            if (event._.$ == 'change') {
                const source = event._._;
                const bench_markup = benchmark.run();
                const markup = renderMarkup(source);
                return {
                    ...state,
                    editor: Editor.update(state.editor, event._),
                    markup, gentime: bench_markup()
                };
            }
            return {
                ...state,
                editor: Editor.update(state.editor, event._)
            };
        case 'set-advanced':
            return { ...state, advanced: event._ };
        case 'scroll':
            return { ...state, scroll: event._ };
    }
    return state;
}

function getScrollHeight(elm: HTMLElement): number {
    return elm.scrollTop / (elm.scrollHeight - elm.clientHeight);
}

function setScrollHeight(elm: HTMLElement, scroll: number) {
    elm.scrollTop = Math.round(scroll * (elm.scrollHeight - elm.clientHeight));
}

function wrapEditor(state: State, send: Send<Event>, vnode: VNode): VNode {
    const data = vnode.data as VData;
    const on = data.on || (data.on = {});
    const hook = data.hook || (data.hook = {});
    const { postpatch } = hook;
    const { scroll } = on;

    hook.postpatch = (_, vnode) => {
        if (postpatch) postpatch(_, vnode);
        setScrollHeight(vnode.elm as HTMLElement, state.scroll);
    };

    on.scroll = (e, vnode) => {
        if (scroll) scroll(e, vnode);
        send({ $: 'scroll', _: getScrollHeight(vnode.elm as HTMLElement) });
    };

    data.style = { height: '250px' };

    return vnode;
}

const simple_editor_send_wrap = send_wrap('editor');

function render(state: State, send: Send<Event>): VNode {
    return vnode_log(h('div.wrapper-small', [
        h('div', [
            h('label', { class: { checkbox: true } }, [
                h('input', {
                    attrs: { type: 'checkbox', checked: state.advanced },
                    props: { checked: state.advanced },
                    on: { click: (_, vnode) => { send(keyed('set-advanced' as 'set-advanced', (vnode.elm as HTMLInputElement).checked)); } }
                }),
                h('span', { class: { checkbox__label: true } }, 'Advanced editor')
            ]),
            h('label', { class: { textfield: true } }, [
                //h('span', { class: { textfield__label: true } }, `Markdown source (${state.gentime.toPrecision(3)} mS, ${(1000 / state.gentime).toPrecision(3)} FPS)`)
                wrapEditor(state, send, (state.advanced ? AdvancedEditor.render : SimpleEditor.render)(state.editor, simple_editor_send_wrap(send))),
            ])
        ]),
        h('span', `Preview (${state.gentime.toPrecision(3)} mS, ${(1000 / state.gentime).toPrecision(3)} FPS)`),
        wrapEditor(state, send, h('div.markup-preview', state.markup)),
    ]));
}

const app: Component<State, Event> = { create, update, render };

export default app;
