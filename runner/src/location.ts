import { Fork, Keyed, Option, Result } from 'literium';

// Smart router API
export interface RouterApi<Args> {
    // match path to get state
    match(path: string): Option<Args>;
    // build path using state
    build(args: Args): Option<string>;
}

export type SetRoute<Args> = Keyed<'route', Result<[Args, string], string>>;

// Navigation API init
export interface NavInit {
    <Args, Signal extends SetRoute<Args>>(router: RouterApi<Args>): NavApi<Signal>;
}

// Smart navigation API
export interface NavApi<Signal> {
    // initialize navigation api
    create(fork: Fork<Signal>): void;
    // process direct navigation
    direct(url: string): void;
    // handle page navigation events
    handle(event: Event): void;
}
