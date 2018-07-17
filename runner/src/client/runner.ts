import {
    init as init_,
    attributesModule as attrsModule, classModule, styleModule, propsModule, eventListenersModule as eventModule
} from 'snabbdom-ng';

import { VNode, VData, Done, Component, task_pool, deferred, dummy } from 'literium';

export interface Run<State, Signal> {
    (app: Component<State, Signal>, elm?: Node): Done;
}

export function init<State, Signal>(doc: Document = document): Run<State, Signal> {
    const { read, patch } = init_<VData>([
        classModule(document),
        styleModule(requestAnimationFrame),
        attrsModule(),
        propsModule(),
        eventModule(document),
    ], document);

    return ({ create, update, render }, elm = doc.documentElement) => {
        let frame: any;
        const [spawn, run, kill] = task_pool(dummy);
        const deferred_emit = deferred(emit);

        let vnode = read(elm);
        let state = create(deferred_emit, spawn);

        view();
        run();

        return kill;

        function view() {
            frame = undefined;
            const vnode_ = vnode;
            vnode = render(state, deferred_emit) as VNode;
            patch(vnode_, vnode);
        }

        function emit(signal: Signal) {
            if (!frame) frame = requestAnimationFrame(view);
            state = update(state, signal, deferred_emit, spawn);
            //console.log('emit:', signal);
            //console.log('state:', state);
        }
    };
}
