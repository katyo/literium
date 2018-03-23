export interface Bench {
    tune(cycles?: number): number;
    run(): () => number;
}

export function bench(): Bench {
    const now = typeof performance != 'undefined' && performance.now ?
        () => performance.now() : Date.now ? Date.now : () => (new Date()).getTime()

    let overhead: number = 0;

    const run = () => {
        const start = now();
        return () => {
            return now() - start - overhead;
        };
    };

    return {
        tune: (cycles: number = 100000) => {
            let accum: number = 0;
            let count: number = cycles;
            for (; count--;) accum += run()();
            return overhead = accum / cycles;
        },
        run,
    };
}
