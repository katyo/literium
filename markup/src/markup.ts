import { VNodeChild, VNodeChildren } from 'literium';
import { RuleSet, Options, Links, Headings, Parser, init, parse } from './md/parser';
import { vdomRender } from './md/render/vdom';

export interface State {
    parser: Parser<VNodeChild>;
    markup: VNodeChild[];
    links: Links;
    headings: Headings;
}

export interface UpdateSource {
    $: 'update';
    _: string;
}

export type Event = UpdateSource;

export function create(rules: RuleSet, options: Options): State {
    return {
        parser: init(rules, vdomRender, options),
        markup: [],
        links: {},
        headings: [],
    };
}

export function update(state: State, event: Event): State {
    switch (event.$) {
        case 'update':
            const links: Links = {};
            const headings: Headings = [];
            const markup = parse(state.parser, event._, links, headings);
            return { ...state, markup, links, headings };
    }
}

export function render(state: State): VNodeChildren {
    return state.markup;
}
