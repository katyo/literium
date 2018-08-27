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
        ({ }, { _, l }) => h('pre', h('code', { class: { hljs: true } }, highlight(_, l)[0]))
    ];
}

export function CodeBlockWithClassVDom(options?: Options): BlockRenderRuleVDom<BlockCode, NoMeta> {
    const highlight = initHighlight(options);
    return [
        ContextTag.Block,
        BlockTag.Code,
        ({ }, { _, l }) => {
            const [markup, language] = highlight(_, l);
            return h('pre', h('code', { class: { hljs: true, [`hljs-${language}`]: true } }, markup))
        }
    ];
}

export function CodeSpanVDom(options?: Options): InlineRenderRuleVDom<InlineCode, NoMeta> {
    const highlight = initHighlight(options);
    return [
        ContextTag.Inline,
        InlineTag.Code,
        ({ }, { _ }) => h('code', highlight(_)[0])
    ];
}
