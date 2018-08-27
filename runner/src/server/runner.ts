import {
    init as init_,
    attributesModule as attrsModule, classModule, styleModule
} from 'snabbdom-ng/html';

import { Emit, Future, tuple, task_pool, deferred } from '@literium/base';
import { VNode, VData, Component } from '@literium/core';

import { Readable } from 'stream';

export interface Init {
    <Props, State, Signal>(app: Component<Props, State, Signal>): Run<Props, State, Signal>;
}

export interface Run<Props, State, Signal> {
    (props: Props): Future<[Readable, State]>;
}

export function init<Props, State, Signal>(doctype: string = 'html', timeout?: number): Init {
    const write = init_<VData>([
        attrsModule,
        classModule,
        styleModule,
    ]);

    return <Props, State, Signal>({ create, update, render }: Component<Props, State, Signal>) => (props: Props) => (end: Emit<[Readable, State]>) => {
        let final = false;
        let timer: any;

        const [spawn, run, kill] = task_pool(done);
        const deferred_emit = deferred(emit);
        let state = create(props, deferred_emit, spawn);
        if (timeout) timer = setTimeout(done, timeout);

        run();

        return stop;

        function emit(signal: Signal) {
            if (!final) {
                //console.log('emit: ', signal);
                state = update(props, state, signal, deferred_emit, spawn);
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
                const vnode = render(props, state, deferred_emit) as VNode;
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
