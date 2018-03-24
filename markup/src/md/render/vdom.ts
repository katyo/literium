import { VNodeChildren, VData, h, flat_map } from 'literium';
import { InlineTag, InlineToken } from '../inline/token';
import { BlockTag, BlockToken, Align } from '../block/token';
import { textAlign, listBullet, listMarker } from './utils';
import { Renderer } from '../parser';

function cellData(align: Align): VData {
    const val = textAlign[align];
    return val ? { style: { 'text-align': val } } : {};
}

function renderBlock(block: BlockToken<VNodeChildren>): VNodeChildren {
    switch (block.$) {
        case BlockTag.Chunks: return block._ as VNodeChildren;
        case BlockTag.Heading: return h(`h${block.n}`, { attrs: { id: block.a } }, block._);
        case BlockTag.Paragraph: return h('p', block._);
        case BlockTag.Quote: return h('blockquote', flat_map(block._, renderBlock));
        case BlockTag.List: return h('ul', { attrs: { type: listBullet[block.b] } },
            flat_map(block._, item => h('li', flat_map(item._, renderBlock))));
        case BlockTag.OrdList: return h('ol', { attrs: { type: listMarker[block.m] } },
            flat_map(block._, item => h('li', flat_map(item._, renderBlock))));
        case BlockTag.Table: return h('table', [
            h('thead', h('tr', block.h.map((col, idx) => h('th', cellData(block.a[idx]), col)))),
            h('tbody', block._.map(row => h('tr', row.map((cell, idx) => h('td', cellData(block.a[idx]), cell)))))
        ]);
        case BlockTag.Code: return h('pre', h('code', block._));
        case BlockTag.Space: return h('!', 'newline');
        case BlockTag.Hr: return h('hr');
        case BlockTag.Text: return block._;
        //case BlockTag.Html: return h('!', block._);
    }
}

function renderInline(inline: InlineToken<VNodeChildren>): VNodeChildren {
    if (typeof inline == 'string') return inline;
    switch (inline.$) {
        case InlineTag.Chunks: return inline._ as VNodeChildren;
        case InlineTag.Link: return h('a', { attrs: { href: inline.l, title: inline.t } }, inline._);
        case InlineTag.Image: return h('img', { attrs: { src: inline.l, title: inline.t, alt: inline._ } });
        case InlineTag.Anchor: return h('a', { attrs: { id: inline._ } });
        case InlineTag.Strong: return h('strong', inline._);
        case InlineTag.Em: return h('em', inline._);
        case InlineTag.Code: return h('code', inline._);
        case InlineTag.Del: return h('del', inline._);
        case InlineTag.Br: return h('br');
        case InlineTag.Math: return h('math', inline._);
    }
}

export const vdomRender: Renderer<VNodeChildren> = { block: renderBlock, inline: renderInline };
