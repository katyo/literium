import { VNodeChildren, h } from 'literium';
import { BlockTag, BlockCode, Renderer } from 'literium-markup';
import { initHighlight, vdomRender } from 'literium-highlight';

import {
    registerLanguages,
    CPlusPlus,
    TypeScript,
    JavaScript,
    Python,
    Lua,
    Makefile,
    XML,
    Markdown,
    Shell,
    Bash
} from 'literium-highlight';

registerLanguages(
    CPlusPlus,
    TypeScript,
    JavaScript,
    Python,
    Lua,
    Makefile,
    XML,
    Markdown,
    Shell,
    Bash
);

const renderHightlight = initHighlight(vdomRender);

function codeBlock(block: BlockCode): VNodeChildren {
    let content: VNodeChildren;
    if (block.l) {
        try {
            content = renderHightlight(block._, block.l);
        } catch ({ message }) {
            content = `${message}\n${block._}`;
        }
    } else {
        content = block._;
    }
    return h('pre', h('code', { class: { hljs: !!block.l } }, content));
}

export function highlightVDomRender({ block, inline }: Renderer<VNodeChildren>): Renderer<VNodeChildren> {
    return {
        block: b => b.$ == BlockTag.Code ? codeBlock(b) : block(b),
        inline
    };
}
