import { Either, Keyed, either_a, either_b } from 'literium';

export type Region = [number, number];

export type Selection = Either<number, Region>;

export interface State {
    content: string;
    selection: Selection;
}

export type Event = Keyed<'change', string> | Keyed<'select', Selection>;

export function create(): State {
    return {
        content: '',
        selection: either_a(0)
    };
}

export function update(state: State, event: Event): State {
    switch (event.$) {
        case 'change': return { ...state, content: event._ };
        case 'select': return { ...state, selection: fixSelection(state, event._) };
    }
}

function fixRange(val: number, min: number, max: number): number {
    return Math.min(Math.max(min, val), max);
}

function fixSelection({ content }: State, sel: Selection): Selection {
    return sel.$ ?
        either_b([fixRange(sel._[0], 0, content.length), fixRange(sel._[1], 0, content.length)] as [number, number]) :
        either_a(fixRange(sel._, 0, content.length));
}

export function equalSelection(a: Selection, b: Selection): boolean {
    return a.$ == b.$ && (a.$ ? a._[0] == (b._ as Region)[0] && a._[1] == (b._ as Region)[1] : a._ == b._);
}
