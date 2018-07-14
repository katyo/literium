import {
    init as init_,
    attributesModule as attrsModule, classModule, styleModule
} from 'snabbdom-ng';
import {
    htmlDomApi, render as toHtml,
    attributesApi as attrsApi, classApi, styleApi
} from 'snabbdom-ng/server';

import { VData, Create, Emit, Future, task_pool, identity } from 'literium';

export interface Run {
    (app: Create): Future<string>;
}

export function init(doctype: string = 'html', timeout?: number): Run {
    const { read, patch } = init_<VData>([
        attrsModule(attrsApi),
        classModule(classApi),
        styleModule(styleApi),
    ], htmlDomApi);

    return (create: Create) => (emit: Emit<string>) => {
        const [spawn, drop] = task_pool(done);
        const render = create(identity, spawn);

        let timer: any;
        if (timeout) timer = setTimeout(done, timeout);

        function stop() {
            drop();
            if (timer) clearTimeout(timer);
        }

        function done() {
            //console.log('done');
            stop();
            const doc = htmlDomApi.createElement('html');
            const vnode = render();
            patch(read(doc), vnode);
            emit(`<!DOCTYPE ${doctype}>${toHtml(doc)}`);
        }

        return stop;
    };
}
