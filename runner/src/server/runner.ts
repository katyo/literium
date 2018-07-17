import {
    init as init_,
    attributesModule as attrsModule, classModule, styleModule
} from 'snabbdom-ng/html';

import { VNode, VData, Component, Emit, Future, tuple, task_pool, deferred } from 'literium';

import { Readable } from 'stream';

export interface Run<State, Signal> {
    (app: Component<State, Signal>): Future<[Readable, State]>;
}

export function init<State, Signal>(doctype: string = 'html', timeout?: number): Run<State, Signal> {
    const write = init_<VData>([
        attrsModule,
        classModule,
        styleModule,
    ]);

    return ({ create, update, render }) => (end: Emit<[Readable, State]>) => {
        let final = false;
        let timer: any;

        const [spawn, run, kill] = task_pool(done);
        const deferred_emit = deferred(emit);
        let state = create(deferred_emit, spawn);
        if (timeout) timer = setTimeout(done, timeout);

        run();

        return stop;

        function emit(signal: Signal) {
            if (!final) {
                //console.log('emit: ', signal);
                state = update(state, signal, deferred_emit, spawn);
            }
        }

        function stop() {
            final = true;
            kill();
            if (timer) clearTimeout(timer);
        }

        function done() {
            if (!final) {
                //console.log('done');
                stop();
                const vnode = render(state, deferred_emit) as VNode;
                const stream = new Readable({
                    read() {
                        stream.push(`<!DOCTYPE ${doctype}>`);
                        write(vnode, chunk => {
                            stream.push(chunk);
                        });
                        stream.push(null);
                    }
                });
                end(tuple(stream, state));
            }
        }
    };
}
