import { VNodeChild, h } from 'literium';
import {
    ContextTag,
    NoMeta, MetaHeadings,
    UnknownToken,
    BlockTag,
    BlockCode, BlockHeading,
    BlockHr, BlockQuote,
    BlockList, BlockOrdList,
    BlockParagraph, BlockText,
    BlockTable,
    BlockListItem,
    BlockTableCell,
    BlockAlign,
    BlockTableRow,
    renderNest,
    textAlign
} from 'marklit';
import {
    BlockRenderRuleVDom,
    BlockRenderHandleVDom,
} from '../vdom';

export const CodeBlockVDom: BlockRenderRuleVDom<BlockCode, NoMeta> = [
    ContextTag.Block,
    BlockTag.Code,
    ({ }, { _ }) => h('pre', h('code', _))
];

export const CodeBlockWithClassVDom: BlockRenderRuleVDom<BlockCode, NoMeta> = [
    ContextTag.Block,
    BlockTag.Code,
    ({ }, { _, l }) => h('pre', h('code', { class: { [`language-${l}`]: !!l } }, _))
];

export const HeadingVDom: BlockRenderRuleVDom<BlockHeading<UnknownToken>, MetaHeadings<UnknownToken>> = [
    ContextTag.Block,
    BlockTag.Heading,
    ($, { n, i, _ }) => h(`h${n}`, renderNest($, _, ContextTag.Inline))
];

export const HeadingWithIdVDom: BlockRenderRuleVDom<BlockHeading<UnknownToken>, MetaHeadings<UnknownToken>> = [
    ContextTag.Block,
    BlockTag.Heading,
    ($, { n, i, _ }) => h(`h${n}`, { attrs: { id: `${$.m.headings[i].t.toLowerCase().replace(/[^\w]+/g, '-')}` } },
        renderNest($, _, ContextTag.Inline))
];

export const HrVDom: BlockRenderRuleVDom<BlockHr, NoMeta> = [
    ContextTag.Block,
    BlockTag.Hr,
    ({ }, { }) => h('hr')
];

export const QuoteVDom: BlockRenderRuleVDom<BlockQuote<UnknownToken>, NoMeta> = [
    ContextTag.Block,
    BlockTag.Quote,
    ($, { _ }) => h('blockquote', renderNest($, _))
];

export const ListVDom: BlockRenderRuleVDom<BlockList<UnknownToken>, NoMeta> = [
    ContextTag.Block,
    BlockTag.List,
    ($, { _ }) => h('ul', renderListItems($, _))
];

export const OrdListVDom: BlockRenderRuleVDom<BlockOrdList<UnknownToken>, NoMeta> = [
    ContextTag.Block,
    BlockTag.OrdList,
    ($, { s, _ }) => h('ol',
        { attrs: { start: s != null && s != 1 ? s : null } },
        renderListItems($, _))
];

function renderListItems($: BlockRenderHandleVDom<BlockList<UnknownToken> | BlockOrdList<UnknownToken>, NoMeta>, items: BlockListItem<UnknownToken>[]): VNodeChild[] {
    let out: VNodeChild[] = [];
    for (const item of items) {
        const children = renderNest($, item._);
        if (item.t) {
            (children as VNodeChild[]).unshift(
                h('input', { attrs: { type: 'checkbox', checked: item.c, disabled: true } })
            );
        }
        out.push(h('li', children));
    }
    return out;
}

export const ParagraphVDom: BlockRenderRuleVDom<BlockParagraph<UnknownToken>, NoMeta> = [
    ContextTag.Block,
    BlockTag.Paragraph,
    ($, { _ }) => h('p', renderNest($, _, ContextTag.Inline))
];

export const TextBlockVDom: BlockRenderRuleVDom<BlockText<UnknownToken>, NoMeta> = [
    ContextTag.Block,
    BlockTag.Text,
    ($, { _ }) => renderNest($, _, ContextTag.Inline)
];

export const TableVDom: BlockRenderRuleVDom<BlockTable<UnknownToken>, NoMeta> = [
    ContextTag.Block,
    BlockTag.Table,
    ($, { h: hh, a, _ }) => h('table', [
        h('thead', h('tr', renderTableCells($, hh, 'th', a))),
        ...(_.length ? [h('tbody', renderTableRows($, _, a))] : [])
    ])
];

function renderTableRows($: BlockRenderHandleVDom<BlockTable<UnknownToken>, NoMeta>, rows: BlockTableRow<UnknownToken>[], align: BlockAlign[]): VNodeChild[] {
    let out: VNodeChild[] = [];
    for (const row of rows) {
        out.push(h('tr', renderTableCells($, row, 'td', align)));
    }
    return out;
}

function renderTableCells($: BlockRenderHandleVDom<BlockTable<UnknownToken>, NoMeta>, cells: BlockTableCell<UnknownToken>[], tag: string, align: BlockAlign[]): VNodeChild[] {
    let out: VNodeChild[] = [];
    for (let i = 0; i < cells.length; i++) {
        const a = textAlign[align[i]];
        out.push(h(tag, { attrs: { align: a } },
            renderNest($, cells[i])));
    }
    return out;
}

export const BlockVDom = [CodeBlockWithClassVDom, HeadingWithIdVDom, HrVDom, QuoteVDom, ListVDom, OrdListVDom, ParagraphVDom, TextBlockVDom];

export const BlockTablesVDom = [...BlockVDom, TableVDom];
