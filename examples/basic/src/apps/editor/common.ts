import { Either, Keyed, a, b } from 'literium';

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
        selection: a(0)
    };
}

export function update(state: State, event: Event): State {
    switch (event.$) {
        case 'change': return { ...state, content: event._ };
        case 'select': {
            const selection = fixSelection(state, event._);
            return equalSelection(state.selection, selection) ?
                state : { ...state, selection };
        }
    }
}

function fixRange(val: number, min: number, max: number): number {
    return Math.min(Math.max(min, val), max);
}

function fixSelection({ content }: State, sel: Selection): Selection {
    return sel.$ ?
        b([fixRange(sel._[0], 0, content.length), fixRange(sel._[1], 0, content.length)] as [number, number]) :
        a(fixRange(sel._, 0, content.length));
}

export function equalSelection(a: Selection, b: Selection): boolean {
    return a.$ == b.$ && (a.$ ? a._[0] == (b._ as Region)[0] && a._[1] == (b._ as Region)[1] : a._ == b._);
}
