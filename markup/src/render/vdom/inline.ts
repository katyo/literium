import { h } from 'literium';
import {
    ContextTag,
    NoMeta, MetaLinks, MetaLink,
    UnknownToken,
    InlineTag,
    InlineLink, InlineImage,
    InlineStrong, InlineEm, InlineDel,
    InlineCode, InlineMath,
    InlineBr,
    sanitizeUrl,
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
    if (m.links) {
        const $ = m.links[l];
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

export const BrVDom: InlineRenderRuleVDom<InlineBr, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Br,
    () => h('br')
];

export const InlineVDom = [LinkVDom, ImageVDom, StrongVDom, EmVDom, CodeSpanVDom, BrVDom];

export const InlineGfmVDom = [LinkVDom, ImageVDom, StrongVDom, EmVDom, CodeSpanVDom, BrVDom, DelVDom];
