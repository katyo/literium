/**
 * Original source:
 *
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

import { append } from '../utils';
import { BlockTag, Align, BlockToken, PureBlockToken, BlockItem, Marker, Bullet } from './token';
import * as Token from './token';
import { InlineLexer, inlineLex } from '../inline/lexer';
import { Options, Links, Headings, Rules, Render } from '../parser';

export interface BlockLexer<Type> {
    rules: Rules;
    options: Options;
    render: Render<BlockToken<Type>, Type>;
    ilexer: InlineLexer<Type>;
}

/**
 * Block Lexer
 */

export function blockInit<Type>(rules: Rules, render: Render<BlockToken<Type>, Type>, ilexer: InlineLexer<Type>, options: Options): BlockLexer<Type> {
    return { rules, render, ilexer, options };
}

/**
 * Preprocessing
 */

export function blockLex<Type>(lexer: BlockLexer<Type>, src: string, links: Links, headings?: Headings): Type {
    return lexer.render({
        $: BlockTag.Chunks,
        _: renderTokens(lexer, links,
            token(lexer, links, headings, src
                .replace(/\r\n|\r/g, '\n')
                .replace(/\t/g, '    ')
                .replace(/\u00a0/g, ' ')
                .replace(/\u2424/g, '\n'), true))
            .map(lexer.render)
    });
}

function renderTokens<Type>(lexer: BlockLexer<Type>, links: Links, tokens: BlockToken<string>[]): BlockToken<Type>[] {
    const inline = (src: string) => inlineLex(lexer.ilexer, src, links);

    return tokens.map(token => {
        switch (token.$) {
            case BlockTag.Heading:
            case BlockTag.Paragraph:
            case BlockTag.Text:
                (token as any as Token.BlockText<Type>)._ = inline(token._);
                return token as any as Token.BlockText<Type>;
            case BlockTag.Quote:
                (token as any as Token.BlockQuote<Type>)._ = renderTokens(lexer, links, token._);
                return token as any as Token.BlockQuote<Type>;
            case BlockTag.List:
            case BlockTag.OrdList:
                (token as any as Token.BlockList<Type>)._ = token._.map(item => {
                    (item as any as Token.BlockItem<Type>)._ = renderTokens(lexer, links, item._);
                    return (item as any as Token.BlockItem<Type>);
                });
                return token as any as Token.BlockList<Type>;
            case BlockTag.Table:
                (token as any as Token.BlockTable<Type>).h = token.h.map(inline);
                (token as any as Token.BlockTable<Type>)._ = token._.map(row => row.map(inline));
                return token as any as Token.BlockTable<Type>;
            default:
                return token as BlockToken<Type>;
        }
    });
}

function marker(mark: string): Marker | void {
    const c = mark.charCodeAt(0);
    return c >= 0x30 && c <= 0x39 ? Marker.Numer :
        c >= 0x41 && c <= 0x48 ? Marker.Alpha :
            c >= 0x61 && c <= 0x68 ? Marker.alpha :
                c == 0x49 ? Marker.Roman :
                    c == 0x69 ? Marker.roman :
                        undefined;
}

const bullet: Record<string, Bullet> = {
    '-': Bullet.Square,
    '*': Bullet.Disc,
    '+': Bullet.Circle,
};

/**
 * Lexing
 */

function token<Type>(lexer: BlockLexer<Type>, links: Links, headings: Headings | void, src: string, top: boolean, bq?: true): BlockToken<string>[] {
    const { rules, options } = lexer;

    const tokens: BlockToken<string>[] = [];
    let text_tokens: string | void;

    const outToken = (token: BlockToken<string>) => {
        append(tokens, token);
    };

    const flushText = () => {
        if (text_tokens !== undefined) {
            outToken({ $: BlockTag.Text, _: text_tokens });
            text_tokens = undefined;
        }
    };

    const out = (token: PureBlockToken<string>) => {
        flushText();
        outToken(token);
    };

    const outText = (text: string) => {
        if (text_tokens !== undefined) {
            text_tokens += `\n${text}`;
        } else {
            text_tokens = text;
        }
    };

    const outHeading = (level: number, anchor: string, text: string) => {
        if (headings) headings.push({ level, anchor, text });
        out({ $: BlockTag.Heading, n: level, a: anchor, _: text });
    };

    const outTable = (header: string, align: string, cells: string) => {
        out({
            $: BlockTag.Table,
            h: header.replace(/^ *| *\| *$/g, '').split(/ *\| */),
            a: align.replace(/^ *|\| *$/g, '').split(/ *\| */)
                .map(hint => /^ *-+: *$/.test(hint) ? Align.Right :
                    /^ *:-+: *$/.test(hint) ? Align.Center :
                        /^ *:-+ *$/.test(hint) ? Align.Left :
                            Align.None),
            //_: cells.replace(/\n$/, '').split('\n')
            //    .map(row => row.split(/ *\| */))
            _: cells.replace(/(?: *\| *)?\n$/, '').split('\n')
                .map(row => row.replace(/^ *\| *| *\| *$/g, '').split(/ *\| */))
        });
    };

    src = src.replace(/^ +$/gm, '');

    let next: boolean,
        loose: boolean,
        cap: RegExpMatchArray | null,
        bull: string,
        b: string,
        item: string,
        space: number,
        i: number,
        l: number;

    const fwd = () => {
        src = src.substring((cap as RegExpMatchArray)[0].length);
    };

    while (src) {
        // newline
        if (cap = rules.newline.exec(src)) {
            fwd();
            if (cap[0].length > 1) {
                out({ $: BlockTag.Space });
            }
        }

        // code
        if (cap = rules.codeblock.exec(src)) {
            fwd();
            item = cap[0].replace(/^ {4}/gm, '');
            out({ $: BlockTag.Code, _: options.pedantic ? item : item.replace(/\n+$/, '') });
            continue;
        }

        // fences (gfm)
        if (cap = rules.fences.exec(src)) {
            fwd();
            out({ $: BlockTag.Code, l: cap[2], _: cap[3], f: true });
            continue;
        }

        // heading
        if (cap = rules.heading.exec(src)) {
            fwd();
            outHeading(cap[1].length, cap[2], cap[3]);
            continue;
        }

        // table no leading pipe (gfm)
        if (top && (cap = rules.nptable.exec(src))) {
            fwd();
            outTable(cap[1], cap[2], cap[3]);
            continue;
        }

        // lheading
        if (cap = rules.lheading.exec(src)) {
            fwd();
            outHeading(cap[3] == '=' ? 1 : 2, cap[1], cap[2]);
            continue;
        }

        // hr
        if (cap = rules.hr.exec(src)) {
            fwd();
            out({ $: BlockTag.Hr });
            continue;
        }

        // blockquote
        if (cap = rules.quote.exec(src)) {
            fwd();

            // Pass `top` to keep the current
            // "toplevel" state. This is exactly
            // how markdown.pl works.
            out({
                $: BlockTag.Quote,
                _: token(lexer, links, headings,
                    cap[0].replace(/^ *> ?/gm, ''), top, true)
            });

            continue;
        }

        // list
        if (cap = rules.list.exec(src)) {
            fwd();
            bull = cap[2];

            // Get each top-level item.
            cap = cap[0].match(rules.item) as RegExpMatchArray;

            next = false;
            l = cap.length;
            i = 0;

            const items: BlockItem<string>[] = [];

            for (; i < l; i++) {
                item = cap[i];

                // Remove the list item's bullet
                // so it is seen as the next token.
                space = item.length;
                item = item.replace(/^ *([*+-]|(?:\d+|[aAiI])\.) +/, '');

                // Outdent whatever the
                // list item contains. Hacky.
                if (~item.indexOf('\n ')) {
                    space -= item.length;
                    item = options.pedantic
                        ? item.replace(/^ {1,4}/gm, '')
                        : item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '');
                }

                // Determine whether the next list item belongs here.
                // Backpedal if it does not belong in this list.
                if (options.smartLists && i !== l - 1) {
                    b = (rules.bullet.exec(cap[i + 1]) as RegExpMatchArray)[0];
                    if (bull !== b && !(bull.length > 1 && b.length > 1)) {
                        src = cap.slice(i + 1).join('\n') + src;
                        i = l - 1;
                    }
                }

                // Determine whether item is loose or not.
                // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
                // for discount behavior.
                loose = next || !!/\n\n(?!\s*$)/.test(item);
                if (i !== l - 1) {
                    next = item.charAt(item.length - 1) === '\n';
                    if (!loose) loose = next;
                }

                // Recurse.
                items.push({ l: loose, _: token(lexer, links, headings, item, false, bq) });
            }

            out(bull.length > 1 ? {
                $: BlockTag.OrdList,
                m: marker(bull) || Marker.Numer,
                _: items
            } : {
                    $: BlockTag.List,
                    b: bullet[bull] || Bullet.Circle,
                    _: items
                });

            continue;
        }

        // html
        if (cap = rules.html.exec(src)) {
            fwd();
            // preformatted
            const pre = cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style' || undefined;
            out(options.sanitize ? {
                $: BlockTag.Paragraph,
                p: pre,
                _: cap[0]
            } : {
                    $: BlockTag.Html,
                    p: pre,
                    _: cap[0]
                });

            continue;
        }

        // def
        if ((!bq && top) && (cap = rules.def.exec(src))) {
            fwd();
            links[cap[1].toLowerCase()] = {
                href: cap[2],
                title: cap[3]
            };
            continue;
        }

        // table (gfm)
        if (top && (cap = rules.table.exec(src))) {
            fwd();

            outTable(cap[1], cap[2], cap[3]);
            continue;
        }

        // top-level paragraph
        if (top && (cap = rules.paragraph.exec(src))) {
            fwd();
            out({
                $: BlockTag.Paragraph,
                _: cap[1].charAt(cap[1].length - 1) == '\n'
                    ? cap[1].slice(0, -1)
                    : cap[1]
            });
            continue;
        }

        // text
        if (cap = rules.textblock.exec(src)) {
            // Top-level should never reach here.
            fwd();
            outText(cap[0]);
            continue;
        }

        if (src) {
            throw new Error(`Infinite loop on byte: ${src.charCodeAt(0)} "${src.charAt(0)}"`);
        }
    }

    flushText();

    return tokens;
}
