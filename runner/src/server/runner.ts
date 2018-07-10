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
    (app: Component<State, Signal>, end: (html: string) => void): void;
}

export function init<State, Signal>(doctype: string = 'html', timeout: number = 1000): Run<State, Signal> {
    const { read, patch } = init_<VData>([
        attrsModule(attrsApi),
        classModule(classApi),
        styleModule(styleApi),
    ], htmlDomApi);

    return ({ create, update, render }, end: (html: string) => void) => {
        const emit = (event: Signal) => {
            //console.log('emit: ', event);
            state = update(state, event, fork);
        };
        const [fork, run] = fork_pool(emit, () => {
            //console.log('done');
            const doc = htmlDomApi.createElement('html');
            const vnode = render(state, emit) as VNode;
            patch(read(doc), vnode);
            end(`<!DOCTYPE ${doctype}>${toHtml(doc)}`);
        });
        let state = create(fork);
        run();
    };
}
