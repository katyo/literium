import { VNodeChildren } from 'literium';
import { RuleSet, Renderer, Options, Links, Headings, init, parse } from './md/parser';

export interface Markup {
    (src: string, headings?: Headings): VNodeChildren;
}

export function initMarkup(rules: RuleSet, render: Renderer<VNodeChildren>, options?: Options): Markup {
    const parser = init(rules, render, options);
    return (src: string, headings?: Headings) => {
        const links: Links = {};
        return parse(parser, src, links, headings);
    };
}
