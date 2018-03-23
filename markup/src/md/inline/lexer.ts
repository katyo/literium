/**
 * Original source:
 *
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

import { escape, append, saneLink, smartypants, mangle } from '../utils';
import { InlineTag, InlineToken, TaggedInlineToken, InlinePhraseTag } from './token';
import { Options, Links, Rules, Render, Link } from '../parser';

/**
 * Inline Lexer & Compiler
 */

export interface InlineLexer<Type> {
    rules: Rules;
    options: Options;
    render: Render<InlineToken<Type>, Type>;
    inLink: boolean;
}

export function inlineInit<Type>(rules: Rules, render: Render<InlineToken<Type>, Type>, options: Options): InlineLexer<Type> {
    return { rules, render, options, inLink: false };
}

/**
 * Lexing/Compiling
 */
export function inlineLex<Type>(lexer: InlineLexer<Type>, src: string, links: Links): Type[] {
    const { rules, render, options } = lexer;

    const nodes: Type[] = [];
    let text_chunk: string | void;

    const outToken = (token: InlineToken<Type>) => {
        append(nodes, render(token));
    };

    const flushText = () => {
        if (text_chunk !== undefined) {
            outToken(text_chunk);
            text_chunk = undefined;
        }
    };

    const out = (token: TaggedInlineToken<Type>) => {
        flushText();
        outToken(token);
    };

    const outText = (text: string) => {
        if (text_chunk !== undefined) {
            text_chunk += text;
        } else {
            text_chunk = text;
        }
    };

    const outPhrase = (tag: InlinePhraseTag, src: string) => {
        out({ $: tag, _: inlineLex(lexer, src, links) });
    };

    /**
     * Compile Link
     */
    const outLink = (cap: string, text: string, href: string, title?: string) => {
        if (options.sanitize && !saneLink(href)) return;
        href = escape(href);
        title = title && escape(title);

        out(cap.charAt(0) !== '!'
            ? { $: InlineTag.Link, l: href, t: title, _: inlineLex(lexer, text, links) }
            : { $: InlineTag.Image, l: href, t: title, _: escape(text) });
    };

    let cap: RegExpMatchArray | null,
        link: Link,
        text: string,
        href: string;

    const fwd = () => {
        src = src.substring((cap as RegExpMatchArray)[0].length);
    };

    while (src) {
        // escape
        if (cap = rules.escape.exec(src)) {
            fwd();
            outText(cap[1]);
            continue;
        }

        // math
        if (cap = rules.math.exec(src)) {
            fwd();
            out({ $: InlineTag.Math, _: cap[1] });
            continue;
        }

        // autolink
        if (cap = rules.autolink.exec(src)) {
            fwd();
            if (cap[2] == '@') {
                text = cap[1].charAt(6) == ':'
                    ? mangle(cap[1].substring(7))
                    : mangle(cap[1]);
                href = mangle('mailto:') + text;
            } else {
                text = escape(cap[1]);
                href = text;
            }
            out({ $: InlineTag.Link, l: href, _: inlineLex(lexer, text, links) });
            continue;
        }

        // url (gfm)
        if (!lexer.inLink && (cap = rules.url.exec(src))) {
            fwd();
            text = escape(cap[1]);
            out({ $: InlineTag.Link, l: text, _: inlineLex(lexer, text, links) });
            continue;
        }

        // tag
        if (cap = rules.tag.exec(src)) {
            if (!lexer.inLink && /^<a /i.test(cap[0])) {
                lexer.inLink = true;
            } else if (lexer.inLink && /^<\/a>/i.test(cap[0])) {
                lexer.inLink = false;
            }
            fwd();
            outText(options.sanitize ? escape(cap[0]) : cap[0]);
            continue;
        }

        // link
        if (cap = rules.link.exec(src)) {
            fwd();
            lexer.inLink = true;
            outLink(cap[0], cap[1], cap[2], cap[3]);
            lexer.inLink = false;
            continue;
        }

        // reflink, nolink
        if ((cap = rules.reflink.exec(src))
            || (cap = rules.nolink.exec(src))) {
            fwd();
            link = links[(cap[2] || cap[1]).replace(/\s+/g, ' ').toLowerCase()];
            if (!link || !link.href) {
                outText(cap[0].charAt(0));
                src = cap[0].substring(1) + src;
                continue;
            }
            lexer.inLink = true;
            outLink(cap[0], cap[1], link.href, link.title);
            lexer.inLink = false;
            continue;
        }

        // strong
        if (cap = rules.strong.exec(src)) {
            fwd();
            outPhrase(InlineTag.Strong, cap[2] || cap[1]);
            continue;
        }

        // em
        if (cap = rules.em.exec(src)) {
            fwd();
            outPhrase(InlineTag.Em, cap[2] || cap[1]);
            continue;
        }

        // code
        if (cap = rules.code.exec(src)) {
            fwd();
            outPhrase(InlineTag.Code, escape(cap[2], true));
            continue;
        }

        // br
        if (cap = rules.br.exec(src)) {
            fwd();
            out({ $: InlineTag.Br });
            continue;
        }

        // del (gfm)
        if (cap = rules.del.exec(src)) {
            fwd();
            outPhrase(InlineTag.Del, cap[1]);
            continue;
        }

        // anchor
        if (cap = rules.anchor.exec(src)) {
            fwd();
            out({ $: InlineTag.Anchor, _: cap[1] });
            continue;
        }

        // text
        if (cap = rules.text.exec(src)) {
            fwd();
            outText(escape(options.smartypants ? smartypants(cap[0]) : cap[0]));
            continue;
        }

        if (src) {
            throw new Error(`Infinite loop on byte: ${src.charCodeAt(0)} "${src.charAt(0)}"`);
        }
    }

    flushText();

    return nodes;
}
