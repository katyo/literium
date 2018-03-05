import { init as init_ } from 'snabbdom-ng/snabbdom';
import attrsModule from 'snabbdom-ng/modules/attributes';
import classModule from 'snabbdom-ng/modules/class';
import styleModule from 'snabbdom-ng/modules/style';
import { htmlDomApi, render as toHtml } from 'snabbdom-ng/server/domapi';
import attrsApi from 'snabbdom-ng/server/attributes';
import classApi from 'snabbdom-ng/server/class';
import styleApi from 'snabbdom-ng/server/style';

import { VData } from './vdom';
import { Component } from './types';
import { fork_pool } from './sched';

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
            console.log('send: ', event);
            state = update(state, event, fork);
        };
        const fork = fork_pool(send, () => {
            console.log('done');
            const doc = htmlDomApi.createElement('html');
            const vnode = render(state, send);
            patch(read(doc), vnode);
            end(`<!DOCTYPE ${doctype}>${toHtml(doc)}`);
        });
        let state = create(fork);
    };
}
