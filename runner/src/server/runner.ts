import {
    init as init_,
    attributesModule as attrsModule, classModule, styleModule
} from 'snabbdom-ng';
import {
    htmlDomApi, render as toHtml,
    attributesApi as attrsApi, classApi, styleApi
} from 'snabbdom-ng/server';

import { VNode, VData, Component, Emit, Future, tuple, task_pool, deferred } from 'literium';

export interface Run<State, Signal> {
    (app: Component<State, Signal>): Future<[string, State]>;
}

export function init<State, Signal>(doctype: string = 'html', timeout?: number): Run<State, Signal> {
    const { read, patch } = init_<VData>([
        attrsModule(attrsApi),
        classModule(classApi),
        styleModule(styleApi),
    ], htmlDomApi);

    return ({ create, update, render }) => (end: Emit<[string, State]>) => {
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
                const doc = htmlDomApi.createElement('html');
                const vnode = render(state, deferred_emit) as VNode;
                patch(read(doc), vnode);
                end(tuple(`<!DOCTYPE ${doctype}>${toHtml(doc)}`, state));
            }
        }
    };
}
