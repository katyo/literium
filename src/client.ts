import { init as init_ } from 'snabbdom-ng/snabbdom';
import classModule from 'snabbdom-ng/modules/class';
import styleModule from 'snabbdom-ng/modules/style';
import attrsModule from 'snabbdom-ng/modules/attributes';
import propsModule from 'snabbdom-ng/modules/props';
import eventModule from 'snabbdom-ng/modules/eventlisteners';
import { htmlDomApi } from 'snabbdom-ng/client/domapi';
import classApi from 'snabbdom-ng/client/class';
import styleApi from 'snabbdom-ng/client/style';
import attrsApi from 'snabbdom-ng/client/attributes';
import propsApi from 'snabbdom-ng/client/props';
import eventApi from 'snabbdom-ng/client/eventlisteners';

import { VData } from './vdom';
import { Component } from './types';
import { fork_pool } from './sched';

export interface Run<State, Event> {
    (app: Component<State, Event>, elm?: Node): void;
}

export function init<State, Event>(doc: Document = document): Run<State, Event> {
    const { read, patch } = init_<VData>([
        classModule(classApi),
        styleModule(styleApi),
        attrsModule(attrsApi),
        propsModule(propsApi),
        eventModule(eventApi),
    ], htmlDomApi(doc));

    return ({ create, update, render }, elm = doc.documentElement) => {
        let view_id: any;
        const view = () => {
            view_id = undefined;
            const vnode_ = vnode;
            vnode = render(state, send);
            patch(vnode_, vnode);
        };
        const send = (event: Event) => {
            //console.log('send:', event);
            state = update(state, event, fork);
            //console.log('state:', state);
            if (view_id) {
                clearImmediate(view_id);
            }
            view_id = setImmediate(view);
        };
        const fork = fork_pool(send, () => {
            //console.log('done');
        });
        let state = create(fork);
        let vnode = read(elm);
        view();
    };
}
