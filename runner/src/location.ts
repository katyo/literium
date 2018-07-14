import { Option, Spawn } from 'literium';

// Smart router API
export interface RouterApi<Args> {
    // Match path to get arguments
    match(path: string): Option<Args>;
    // Build path using arguments
    build(args: Args): Option<string>;
}

// Route change signal
export interface SetRoute<Args> {
    (route: Option<Args>, path: string): void;
}

// Navigation API initializer
export interface NavInit {
    <Args>(spawn: Spawn, change: SetRoute<Args>, router: RouterApi<Args>): NavApi<Args>;
}

// Smart navigation API
export interface NavApi<Args> {
    // Initial route
    route: Option<Args>;
    // Initial path
    path: string;
    // Process direct navigation
    direct(url: string): void;
    // Handle page navigation events
    handle(event: Event): void;
}
