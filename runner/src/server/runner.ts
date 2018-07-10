import {
    init as init_,
    attributesModule as attrsModule, classModule, styleModule
} from 'snabbdom-ng';
import {
    htmlDomApi, render as toHtml,
    attributesApi as attrsApi, classApi, styleApi
} from 'snabbdom-ng/server';

import { VNode, VData, Component } from 'literium';
import { fork_pool } from '../sched';

export interface Run<State, Signal> {
    (app: Component<State, Signal>, end: (html: string, state: State) => void): void;
}

export function init<State, Signal>(doctype: string = 'html', timeout?: number): Run<State, Signal> {
    const { read, patch } = init_<VData>([
        attrsModule(attrsApi),
        classModule(classApi),
        styleModule(styleApi),
    ], htmlDomApi);

    return ({ create, update, render }, end: (html: string, state: State) => void) => {
        const emit = (event: Signal) => {
            //console.log('emit: ', event);
            state = update(state, event, fork);
        };
        let timer: any;
        const done = () => {
            //console.log('done');
            if (timer) clearTimeout(timer);
            const doc = htmlDomApi.createElement('html');
            const vnode = render(state, emit) as VNode;
            patch(read(doc), vnode);
            end(`<!DOCTYPE ${doctype}>${toHtml(doc)}`, state);
        };
        const [fork, run] = fork_pool(emit, done);
        let state = create(fork);
        if (timeout) timer = setTimeout(done, timeout);
        run();
    };
}
