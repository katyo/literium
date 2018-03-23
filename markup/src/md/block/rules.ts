/**
 * Original source:
 *
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

import { noop, replace } from '../utils';
import { Rules } from '../parser';

/**
 * Block-Level Grammar
 */

export const newline = /^\n+/;

export const codeblock = /^( {4}[^\n]+\n*)+/;

export const hr = /^( *[-*_]){3,} *(?:\n+|$)/;
//export const hr = /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/;

export const heading = /^ *(#{1,6}) +(?:(?:\x5e([\w-]+)) +)?([^\n]+?) *#* *(?:\n+|$)/;
//export const heading = /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/;

export const def = /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/;
//export const def = /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/;

export const lheading = /^ *(?:(?:\x5e([\w-]+)) )? *([^\n]+)\n *(=|-){2,} *(?:\n+|$)/;
//export const lheading = /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/;

export const textblock = /^[^\n]+/;

export const bullet = /(?:[*+-]|(?:\d+|[AaIi])\.)/;

export const item =
    replace(/^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/, 'gm',
        [/bull/g, bullet]);

export const list =
    replace(/^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/, '',
        [/bull/g, bullet],
        ['hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))'],
        ['def', '\\n+(?=' + def.source + ')']);

export const quote =
    replace(/^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/, '',
        // replace(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/, '',
        ['def', def]);

export const _tag = '(?!(?:'
    + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
    + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
    + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

export const html =
    replace(/^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/, '',
        ['comment', /<!--[\s\S]*?-->/],
        ['closed', /<(tag)[\s\S]+?<\/\1>/],
        ['closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/],
        [/tag/g, _tag]);

export const paragraph =
    replace(/^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/, '',
        // replace(/^([^\n]+(?:\n?(?!hr|heading|lheading| {0,3}>|tag)[^\n]+)+)/, '',
        ['hr', hr],
        ['heading', heading],
        ['lheading', lheading],
        ['blockquote', quote],
        ['tag', '<' + _tag],
        ['def', def]);

/**
 * Normal Block Grammar
 */

export const block_normal: Rules = {
    newline,
    codeblock,
    fences: noop,
    hr,
    heading,
    nptable: noop,
    def,
    table: noop,
    lheading,
    textblock,
    bullet,
    item,
    list,
    quote,
    html,
    paragraph
};

/**
 * GFM Block Grammar
 */

export const fences = /^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/;
export const gfm_paragraph = replace(paragraph, '',
    ['(?!', '(?!'
        + fences.source.replace('\\1', '\\2') + '|'
        + list.source.replace('\\1', '\\3') + '|']);

export const block_gfm: Rules = {
    ...block_normal,
    fences,
    paragraph: gfm_paragraph
};

/**
 * GFM + Tables Block Grammar
 */

export const nptable = /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/;

export const table = /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/;

export const block_gfm_tables: Rules = { ...block_gfm, nptable, table };
