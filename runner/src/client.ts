import {
    init as init_,
    attributesModule as attrsModule, classModule, styleModule, propsModule, eventListenersModule as eventModule
} from 'snabbdom-ng';

import {
    htmlDomApi,
    attributesApi as attrsApi, classApi, styleApi, propsApi, eventListenersApi as eventApi
} from 'snabbdom-ng/es/client';

import { VNode, VData, Component } from 'literium';
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
        let frame: any;
        const view = () => {
            frame = undefined;
            const vnode_ = vnode;
            vnode = render(state, send) as VNode;
            patch(vnode_, vnode);
        };
        const send = (event: Event) => {
            //console.log('send:', event);
            state = update(state, event, fork);
            //console.log('state:', state);
            if (frame) cancelAnimationFrame(frame);
            frame = requestAnimationFrame(view);
        };
        const [fork, run] = fork_pool(send, () => {
            //console.log('done');
        });
        let vnode = read(elm);
        let state = create(fork);
        view();
        run();
    };
}
