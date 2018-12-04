import { h } from '@literium/core';
import {
    ContextTag,
    NoMeta,
    MetaLinks,
    MetaLink,
    MetaAbbrevs,
    MetaFootnotes,
    UnknownToken,
    InlineTag,
    InlineLink,
    InlineImage,
    InlineStrong,
    InlineEm,
    InlineDel,
    InlineCode,
    InlineMath,
    InlineAbbrev,
    InlineFootnote,
    InlineBr,
    InlineText,
    sanitizeUrl,
    simpleId,
    renderNest
} from 'marklit';
import {
    InlineRenderRuleVDom
} from '../vdom';

export const LinkVDom: InlineRenderRuleVDom<InlineLink<UnknownToken>, MetaLinks> = [
    ContextTag.Inline,
    InlineTag.Link,
    ($, { l, t, _ }) => {
        const href = getLinkAttr(l, l, 'l', $.m);
        const nest = renderNest($, _);
        return href == null ? nest : h('a', {
            attrs: {
                href: href || '',
                title: getLinkAttr(l, t, 't', $.m)
            }
        }, nest);
    }
];

export const ImageVDom: InlineRenderRuleVDom<InlineImage, MetaLinks> = [
    ContextTag.Inline,
    InlineTag.Image,
    ($, { l, t, _ }) => {
        const src = getLinkAttr(l, l, 'l', $.m);
        return src ? h('img', {
            attrs: {
                src,
                alt: _ || null,
                title: getLinkAttr(l, t, 't', $.m)
            }
        }) : _;
    }
];

function getLinkAttr(l: string, v: string | void, n: keyof MetaLink, m: MetaLinks): string | undefined {
    if (m.l) {
        const $ = m.l[l];
        if ($ && $[n]) {
            v = $[n] as string;
        }
    }
    if (n == 'l' && v) {
        v = sanitizeUrl(v);
        if (v == null) return;
    }
    if (v != null) return v;
}

export const StrongVDom: InlineRenderRuleVDom<InlineStrong<UnknownToken>, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Strong,
    ($, { _ }) => h('strong', renderNest($, _))
];

export const EmVDom: InlineRenderRuleVDom<InlineEm<UnknownToken>, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Em,
    ($, { _ }) => h('em', renderNest($, _))
];

export const DelVDom: InlineRenderRuleVDom<InlineDel<UnknownToken>, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Del,
    ($, { _ }) => h('del', renderNest($, _))
];

export const CodeSpanVDom: InlineRenderRuleVDom<InlineCode, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Code,
    ({ }, { _ }) => h('code', _)
];

export const MathSpanVDom: InlineRenderRuleVDom<InlineMath, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Math,
    ({ }, { _ }) => h('math', _)
];

export const AbbrevVDom: InlineRenderRuleVDom<InlineAbbrev, MetaAbbrevs> = [
    ContextTag.Inline,
    InlineTag.Abbrev,
    ({ m: { a } }, { t, _ }) => h('abbr', { attrs: { title: t || a[_] } }, _)
];

export const FootnoteVDom: InlineRenderRuleVDom<InlineFootnote, MetaFootnotes> = [
    ContextTag.Inline,
    InlineTag.Footnote,
    ({ m: { f } }, { l }) => {
        const id = simpleId(l);
        return h('sup', { class: { "fn-ref": true } }, h('a', { attrs: { id: `fnref-${id}`, href: `#fn-${id}` } }, l));
    }
];

export const TextVDom: InlineRenderRuleVDom<InlineText, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Text,
    ({ }, { _ }) => _
];

export const BrVDom: InlineRenderRuleVDom<InlineBr, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Br,
    () => h('br')
];

export type InlineVDomToken = InlineLink<UnknownToken> | InlineImage | InlineStrong<UnknownToken> | InlineEm<UnknownToken> | InlineCode | InlineText | InlineBr;

export const InlineVDom: InlineRenderRuleVDom<InlineVDomToken, MetaLinks>[] = [LinkVDom, ImageVDom, StrongVDom, EmVDom, CodeSpanVDom, TextVDom, BrVDom];

export type InlineGfmVDomToken = InlineVDomToken | InlineDel<UnknownToken>;

export const InlineGfmVDom: InlineRenderRuleVDom<InlineGfmVDomToken, MetaLinks>[] = [LinkVDom, ImageVDom, StrongVDom, EmVDom, CodeSpanVDom, TextVDom, BrVDom, DelVDom];

export type InlineLitVDomToken = InlineGfmVDomToken | InlineAbbrev | InlineFootnote;

export const InlineLitVDom: InlineRenderRuleVDom<InlineLitVDomToken, MetaLinks | MetaAbbrevs | MetaFootnotes>[] = [LinkVDom, ImageVDom, StrongVDom, EmVDom, CodeSpanVDom, TextVDom, BrVDom, DelVDom, AbbrevVDom, FootnoteVDom];
