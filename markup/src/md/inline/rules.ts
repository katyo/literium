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
 * Inline-Level Grammar
 */

export const escape = /^\\([\\`*{}\[\]()#+\-.!_\x5e%$?])/;

export const autolink = /^<([^ >]+(@|:\/)[^ >]+)>/;

export const url = noop;

export const tag = /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/;

export const nolink = /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/;

export const strong = /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/;

export const em = /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/;

export const code = /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/;

export const br = /^ {2,}\n(?!\s*$)/;

export const del = noop;

export const text = /^[\s\S]+?(?=[\\<!\[_*`\{\|%\x5e$\?]| {2,}\n|$)/;

export const anchor = /^ *\x5e([\w-]+) */;

export const math = /^\$([^\$]+)\$/;

export const _inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;

export const _href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

export const link = replace(/^!?\[(inside)\]\(href\)/, '',
    ['inside', _inside],
    ['href', _href]);

export const reflink = replace(/^!?\[(inside)\]\s*\[([^\]]*)\]/, '',
    ['inside', _inside]);

/**
 * Normal Inline Grammar
 */

export const inline_normal: Rules = {
    escape,
    autolink,
    url,
    tag,
    link,
    reflink,
    nolink,
    strong,
    em,
    code,
    br,
    del,
    text,
    anchor,
    math,
};

/**
 * Pedantic Inline Grammar
 */

export const inline_pedantic: Rules = {
    escape,
    autolink,
    url,
    tag,
    link,
    reflink,
    nolink,
    strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
    em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
    code,
    br,
    del,
    text,
    anchor,
    math,
};

/**
 * GFM Inline Grammar
 */

export const inline_gfm: Rules = {
    escape: replace(escape, '', ['])', '~|])']),
    autolink,
    url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
    tag,
    link,
    reflink,
    nolink,
    strong,
    em,
    code,
    br,
    del: /^~~(?=\S)([\s\S]*?\S)~~/,
    text: replace(text, '',
        [']|', '~]|'],
        ['|', '|https?://|']),
    anchor,
    math,
};

/**
 * GFM + Line Breaks Inline Grammar
 */

export const inline_gfm_breaks: Rules = {
    escape: replace(escape, '', ['])', '~|])']),
    autolink,
    url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
    tag,
    link,
    reflink,
    nolink,
    strong,
    em,
    code,
    br: replace(br, '', ['{2,}', '*']),
    del: /^~~(?=\S)([\s\S]*?\S)~~/,
    text: replace(text, '',
        [']|', '~]|'],
        ['|', '|https?://|'],
        ['{2,}', '*']),
    anchor,
    math,
};
