import { Fork, Keyed } from 'literium';

export interface HasBase {
    base: string;
}

export interface HasPath {
    path: string;
}

export type SetPath = Keyed<'path', string>;

export function setPath<State extends HasPath>(state: State, event: SetPath): State {
    return event.$ == 'path' ? { ...(state as {}), path: event._ } as State : state;
}

export interface Nav<AppEvent> {
    on(fork: Fork<AppEvent>): void; /* change path events handling */
    go(url: string): void; /* direct navigation processing */
    ev(evt: Event): void; /* click to link events processing */
    is(fn: (path: string) => boolean): void; /* set local path checker */
}
