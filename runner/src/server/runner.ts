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

export interface Run<State, Event> {
    (app: Component<State, Event>, end: (html: string) => void): void;
}

export function init<State, Event>(doctype: string = 'html', timeout: number = 1000): Run<State, Event> {
    const { read, patch } = init_<VData>([
        attrsModule(attrsApi),
        classModule(classApi),
        styleModule(styleApi),
    ], htmlDomApi);

    return ({ create, update, render }, end: (html: string) => void) => {
        const send = (event: Event) => {
            //console.log('send: ', event);
            state = update(state, event, fork);
        };
        const [fork, run] = fork_pool(send, () => {
            //console.log('done');
            const doc = htmlDomApi.createElement('html');
            const vnode = render(state, send) as VNode;
            patch(read(doc), vnode);
            end(`<!DOCTYPE ${doctype}>${toHtml(doc)}`);
        });
        let state = create(fork);
        run();
    };
}
