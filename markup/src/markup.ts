import { VNodeChild, VNodeChildren } from 'literium';
import { RuleSet, Renderer, Options, Links, Headings, Parser, init, parse } from './md/parser';

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

export function create(rules: RuleSet, render: Renderer<VNodeChild>, options: Options): State {
    return {
        parser: init(rules, render, options),
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
