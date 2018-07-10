import {
    init as init_,
    attributesModule as attrsModule, classModule, styleModule, propsModule, eventListenersModule as eventModule
} from 'snabbdom-ng';

import {
    htmlDomApi,
    attributesApi as attrsApi, classApi, styleApi, propsApi, eventListenersApi as eventApi
} from 'snabbdom-ng/es/client';

import { VNode, VData, Component } from 'literium';
import { fork_pool } from '../sched';

export interface Run<State, Signal> {
    (app: Component<State, Signal>, elm?: Node): void;
}

export function init<State, Signal>(doc: Document = document): Run<State, Signal> {
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
            vnode = render(state, emit) as VNode;
            patch(vnode_, vnode);
        };
        const emit = (signal: Signal) => {
            //console.log('emit:', signal);
            state = update(state, signal, fork);
            //console.log('state:', state);
            if (frame) cancelAnimationFrame(frame);
            frame = requestAnimationFrame(view);
        };
        const [fork, run] = fork_pool(emit, () => {
            //console.log('done');
        });
        let vnode = read(elm);
        let state = create(fork);
        view();
        run();
    };
}
