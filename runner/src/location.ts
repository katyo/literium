import { Fork } from 'literium';

export interface HasBase {
    base: string;
}

export interface HasPath {
    path: string;
}

export interface SetPath {
    $: 'path';
    path: string;
}

export function setPath<State extends HasPath>(state: State, { path }: SetPath): State {
    return { ...(state as {}), path } as State;
}

export interface Nav<AppEvent> {
    on(fork: Fork<AppEvent>): void; /* change path events handling */
    go(url: string): void; /* direct navigation processing */
    ev(evt: Event): void; /* click to link events processing */
    is(fn: (path: string) => boolean): void; /* set local path checker */
}
