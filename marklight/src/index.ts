import { h } from '@literium/core';
import {
    ContextTag,
    BlockTag,
    BlockCode,
    InlineTag,
    InlineCode,
    NoMeta,
    BlockRenderRuleVDom,
    InlineRenderRuleVDom
} from '@literium/markup';
import {
  Options,
  initHighlight
} from '@literium/highlight';

export function CodeBlockVDom(options?: Options): BlockRenderRuleVDom<BlockCode, NoMeta> {
    const highlight = initHighlight(options);
    return [
        ContextTag.Block,
        BlockTag.Code,
        ({ }, { _, l }) => h('pre', h('code', { class: { hljs: true } }, highlight(_, l)))
    ];
}

export function CodeBlockWithClassVDom(options?: Options): BlockRenderRuleVDom<BlockCode, NoMeta> {
    const highlight = initHighlight(options);
    return [
        ContextTag.Block,
        BlockTag.Code,
        ({ }, { _, l }) => h('pre', h('code', { class: { hljs: true, [`language-${l}`]: !!l } }, highlight(_, l)))
    ];
}

export function CodeSpanVDom(options?: Options): InlineRenderRuleVDom<InlineCode, NoMeta> {
    return [
        ContextTag.Inline,
        InlineTag.Code,
        ({ }, { _ }) => h('code', _)
    ];
}
