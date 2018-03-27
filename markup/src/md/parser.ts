import { inlineInit } from './inline/lexer';
import { InlineToken } from './inline/token';
import { BlockLexer, blockInit, blockLex } from './block/lexer';
import { BlockToken } from './block/token';

export interface Options {
    pedantic: boolean;
    smartLists: boolean;
    smartypants: boolean;
    sanitize: boolean;
}

export const defaults: Options = {
    pedantic: true,
    smartLists: true,
    smartypants: true,
    sanitize: true
};

export interface Render<Token, Type> {
    (token: Token): Type;
}

export interface Renderer<Type> {
    block: Render<BlockToken<Type>, Type>;
    inline: Render<InlineToken<Type>, Type>;
}

export interface Rules {
    [rule: string]: RegExp;
}

export interface RuleSet {
    block: Rules;
    inline: Rules;
}

export interface Link {
    href: string;
    title?: string;
}

export type Links = Record<string, Link>;

export interface Heading {
    level: number;
    anchor: string;
    text: string;
}

export type Headings = Heading[];

export interface Parser<Type> {
    blexer: BlockLexer<Type>;
}

export function init<Type>(rules: RuleSet, render: Renderer<Type>, custom_options: Partial<Options> = {}): Parser<Type> {
    const options = { ...defaults, ...custom_options };
    const ilexer = inlineInit(rules.inline, render.inline, options);
    return {
        blexer: blockInit(rules.block, render.block, ilexer, options),
    };
}

export function parse<Type>(parser: Parser<Type>, src: string, links: Links, headings?: Headings): Type {
    return blockLex(parser.blexer, src, links, headings);
}
