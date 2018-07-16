import { Emit, Keyed, Option, Result } from 'literium';

// Smart router API
export interface RouterApi<Args> {
    // Match path to get arguments
    match(path: string): Option<Args>;
    // Build path using arguments
    build(args: Args): Option<string>;
}

// Route change signal
export type SetRoute<Args> = Keyed<'route', Result<[Args, string], string>>;

// Navigation API initializer
export interface NavInit {
    <Args, Signal extends SetRoute<Args>>(router: RouterApi<Args>): NavApi<Signal>;
}

// Smart navigation API
export interface NavApi<Signal> {
    // Initialize navigation api
    create(emit: Emit<Signal>): void;
    // Process direct navigation
    direct(url: string): void;
    // Handle page navigation events
    handle(event: Event): void;
}
