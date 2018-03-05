import { VNode } from './vdom';

export function vnode_log(vnode: VNode): VNode {
    if (!vnode.data) vnode.data = {};
    const name = (vnode.sel || '') + ('key' in vnode ? '$' + vnode.key : '');
    const hook = vnode.data.hook || {};
    vnode.data.hook = {
        init: (vnode) => {
            if (hook.init) hook.init(vnode);
            console.log(`${name}::init`);
        },
        create: (_vnode, vnode) => {
            if (hook.create) hook.create(_vnode, vnode);
            console.log(`${name}::create`);
        },
        insert: (vnode) => {
            if (hook.insert) hook.insert(vnode);
            console.log(`${name}::insert`);
        },
        update: (_vnode, vnode) => {
            if (hook.update) hook.update(_vnode, vnode);
            console.log(`${name}::update`);
        },
        destroy: (vnode) => {
            console.log(`${name}::destroy`);
            if (hook.destroy) hook.destroy(vnode);
        },
        remove: (vnode, cb) => {
            console.log(`${name}::remove`);
            if (hook.remove) hook.remove(vnode, cb);
            else cb();
        },
    };
    return vnode;
}
