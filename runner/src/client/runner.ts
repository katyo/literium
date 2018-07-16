import {
    init as init_,
    attributesModule as attrsModule, classModule, styleModule, propsModule, eventListenersModule as eventModule
} from 'snabbdom-ng';

import {
    htmlDomApi,
    attributesApi as attrsApi, classApi, styleApi, propsApi, eventListenersApi as eventApi
} from 'snabbdom-ng/es/client';

import { VNode, VData, Done, Component, task_pool, dummy } from 'literium';

export interface Run<State, Signal> {
    (app: Component<State, Signal>, elm?: Node): Done;
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
        const [spawn, run, kill] = task_pool(dummy);

        let vnode = read(elm);
        let state = create(emit, spawn);

        view();
        run();

        return kill;

        function view() {
            frame = undefined;
            const vnode_ = vnode;
            vnode = render(state, emit) as VNode;
            patch(vnode_, vnode);
        }

        function emit(signal: Signal) {
            if (!frame) frame = requestAnimationFrame(view);
            state = update(state, signal, emit, spawn);
            //console.log('emit:', signal);
            //console.log('state:', state);
        }
    };
}
