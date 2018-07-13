import {
    init as init_,
    attributesModule as attrsModule, classModule, styleModule
} from 'snabbdom-ng';
import {
    htmlDomApi, render as toHtml,
    attributesApi as attrsApi, classApi, styleApi
} from 'snabbdom-ng/server';

import { VNode, VData, Component, Emit, Future, tuple } from 'literium';
import { fork_pool } from '../sched';

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
        const emit = (event: Signal) => {
            if (!final) {
                //console.log('emit: ', event);
                state = update(state, event, fork);
            }
        };
        let timer: any;
        const done = () => {
            if (!final) {
                //console.log('done');
                if (timer) clearTimeout(timer);
                const doc = htmlDomApi.createElement('html');
                const vnode = render(state, emit) as VNode;
                patch(read(doc), vnode);
                end(tuple(`<!DOCTYPE ${doctype}>${toHtml(doc)}`, state));
            }
        };
        const [fork, run] = fork_pool(emit, done);
        let state = create(fork);
        if (timeout) timer = setTimeout(done, timeout);
        run();
        return () => {
            final = true;
            if (timer) clearTimeout(timer);
        };
    };
}
