import {
    init as init_,
    attributesModule as attrsModule, classModule, styleModule, propsModule, eventListenersModule as eventModule
} from 'snabbdom-ng';

import { Done, task_pool, deferred, dummy } from '@literium/base';
import { VNode, VData, Component } from '@literium/core';

export interface Init {
    <Props, State, Signal>(app: Component<Props, State, Signal>): Run<Props, State, Signal>;
}

export interface Run<Props, State, Signal> {
    (props: Props, elm?: Node): Done;
}

export function init(doc: Document = document): Init {
    const { read, patch } = init_<VData>([
        classModule(document),
        styleModule(requestAnimationFrame),
        attrsModule(),
        propsModule(),
        eventModule(document),
    ], document);

    return <Props, State, Signal>({ create, update, render }: Component<Props, State, Signal>) => (props: Props, elm: Node = doc.documentElement as Node) => {
        let frame: any;
        const [spawn, run, kill] = task_pool(dummy);
        const deferred_emit = deferred(emit);

        let vnode = read(elm);
        let state = create(props, deferred_emit, spawn);
        let noemit = false;

        view();
        run();

        return kill;

        function view() {
            frame = undefined;
            const vnode_ = vnode;
            vnode = render(props, state, emit) as VNode;
            noemit = true;
            patch(vnode_, vnode);
            noemit = false;
        }

        function emit(signal: Signal) {
            if (!noemit) {
                if (!frame) frame = requestAnimationFrame(view);
                state = update(props, state, signal, deferred_emit, spawn);
            }
        }
    };
}
