import { Emit, AsKeyed, keyed, key_emit } from '@literium/base';
import { VNode, VData, VNodeChildren, Component, h, vnode_log, bench } from '@literium/core';
import {
    MetaData,
    InlineTokenMap,
    BlockTokenMap,
    ContextMap,

    BlockGfmTables,
    InlineGfm,

    GfmBreaksTextSpan,
    smartyPantsText,

    MetaAbbrevs,
    InlineAbbrev,
    AbbrevBlock,
    abbrevText,

    MetaFootnotes,
    InlineFootnote,
    BlockFootnotes,
    Footnote,
    FootnotesBlock,

    BlockTablesVDom,
    InlineGfmVDom,

    AbbrevVDom,
    FootnoteVDom,
    FootnotesBlockVDom,
    
    initMarkup
} from '@literium/markup';
import './editor/highlight';
import { CodeBlockVDom } from '@literium/marklight';
import * as Editor from './editor/common';
import * as SimpleEditor from './editor/simple';
import * as AdvancedEditor from './editor/advanced';

interface Meta extends MetaData, MetaAbbrevs, MetaFootnotes {}

interface InlineToken extends InlineTokenMap<InlineToken>, InlineAbbrev, InlineFootnote { }
 
interface BlockToken extends BlockTokenMap<BlockToken, InlineToken>, BlockFootnotes<BlockToken> { }

interface Context extends ContextMap<BlockToken, InlineToken, Meta> { }

import example_md from './sample.md';

const benchmark = bench();

const renderMarkup = initMarkup<Context>([...BlockGfmTables, ...InlineGfm, abbrevText(smartyPantsText(GfmBreaksTextSpan)), AbbrevBlock, Footnote, FootnotesBlock], [...BlockTablesVDom, ...InlineGfmVDom, CodeBlockVDom(), AbbrevVDom, FootnoteVDom, FootnotesBlockVDom]);

export const enum ScrollSource {
    Editor,
    Preview,
}

export type Props = void;

export interface State {
    editor: Editor.State;
    advanced: boolean;
    markup: VNodeChildren;
    gentime: number;
    scroll: number;
    scrollSource?: ScrollSource;
}

export type Signal = AsKeyed<{
    editor: Editor.Signal;
    scroll: [ScrollSource, number];
    set_advanced: boolean;
}>;

function create(_props: Props): State {
    const source = example_md;
    const bench_markup = benchmark.run();
    const [, markup] = renderMarkup(source);

    return {
        editor: Editor.update(Editor.create(), keyed('change', source)),
        advanced: false,
        markup,
        gentime: bench_markup(),
        scroll: 0
    };
}

function update(_props: Props, state: State, signal: Signal): State {
    console.log(signal);
    switch (signal.$) {
        case 'editor':
            if (signal._.$ == 'change') {
                const source = signal._._;
                const bench_markup = benchmark.run();
                const [, markup] = renderMarkup(source);
                return {
                    ...state,
                    editor: Editor.update(state.editor, signal._),
                    markup,
                    gentime: bench_markup()
                };
            }
            return {
                ...state,
                editor: Editor.update(state.editor, signal._)
            };
        case 'set_advanced':
            return { ...state, advanced: signal._ };
        case 'scroll':
            return { ...state, scroll: signal._[1], scrollSource: signal._[0] };
    }
    return state;
}

function getScrollHeight(elm: HTMLElement): number {
    return elm.scrollTop / (elm.scrollHeight - elm.clientHeight);
}

function setScrollHeight(elm: HTMLElement, scroll: number) {
    elm.scrollTop = Math.round(scroll * (elm.scrollHeight - elm.clientHeight));
}

function wrapContent(src: ScrollSource, state: State, emit: Emit<Signal>, vnode: VNode): VNode {
    const data = vnode.data as VData;
    const on = data.on || (data.on = {});
    const hook = data.hook || (data.hook = {});
    const { insert, update } = hook;
    const { scroll } = on;

    hook.insert = (vnode) => {
        if (insert) insert(vnode);
        if (state.scrollSource != src) {
            setScrollHeight(vnode.elm as HTMLElement, state.scroll);
        }
    };

    hook.update = (_, vnode) => {
        if (update) update(_, vnode);
        if (state.scrollSource != src) {
            setScrollHeight(vnode.elm as HTMLElement, state.scroll);
        }
    };

    on.scroll = (e, vnode) => {
        if (scroll) scroll(e, vnode);
        emit({ $: 'scroll', _: [src, getScrollHeight(vnode.elm as HTMLElement)] });
    };

    data.style = { height: '250px' };

    return vnode;
}

const editor_emit = key_emit('editor');

function render(_props: Props, state: State, emit: Emit<Signal>): VNode {
    return h('div.wrapper-small', [
        h('div', [
            h('label', { class: { checkbox: true } }, [
                h('input', {
                    attrs: { type: 'checkbox', checked: state.advanced },
                    props: { checked: state.advanced },
                    on: { click: (_, vnode) => { emit(keyed('set_advanced', (vnode.elm as HTMLInputElement).checked)); } }
                }),
                h('span', { class: { checkbox__label: true } }, 'Advanced editor')
            ]),
            h('label', { class: { textfield: true } }, [
                //h('span', { class: { textfield__label: true } }, `Markdown source (${state.gentime.toPrecision(3)} mS, ${(1000 / state.gentime).toPrecision(3)} FPS)`)
                vnode_log(wrapContent(ScrollSource.Editor, state, emit, (state.advanced ? AdvancedEditor.render : SimpleEditor.render)(state.editor, editor_emit(emit)))),
            ])
        ]),
        h('span', `Preview (${state.gentime.toPrecision(3)} mS, ${(1000 / state.gentime).toPrecision(3)} FPS)`),
        wrapContent(ScrollSource.Preview, state, emit, h('div.markup-preview', state.markup)),
    ]);
}

export default { create, update, render } as Component<Props, State, Signal>;
