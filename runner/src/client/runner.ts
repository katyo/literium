import {
    init as init_,
    attributesModule as attrsModule, classModule, styleModule, propsModule, eventListenersModule as eventModule
} from 'snabbdom-ng';

import {
    htmlDomApi,
    attributesApi as attrsApi, classApi, styleApi, propsApi, eventListenersApi as eventApi
} from 'snabbdom-ng/es/client';

import { VData, Create, task_pool, patcher } from 'literium';

export interface Run<State, Signal> {
    (app: Create, elm?: Node): void;
}

export function init<State, Signal>(doc: Document = document): Run<State, Signal> {
    const { read, patch } = init_<VData>([
        classModule(classApi),
        styleModule(styleApi),
        attrsModule(attrsApi),
        propsModule(propsApi),
        eventModule(eventApi),
    ], htmlDomApi(doc));

    return (create: Create, elm = doc.documentElement) => {
        let frame: any;
        function draw() {
            //console.log('draw');
            frame = undefined;
            const vnode_ = vnode;
            vnode = render();
            patch(vnode_, vnode);
        };
        function redraw() {
            if (!frame) frame = requestAnimationFrame(draw);
        };
        const [spawn,] = task_pool(() => {
            //console.log('done');
            if (frame) cancelAnimationFrame(frame);
        });
        let vnode = read(elm);
        let render = create(patcher(redraw), spawn);
        draw();
    };
}
