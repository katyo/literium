import { VNode, VNodeChildren, h } from 'literium';

export function content(children: VNodeChildren): VNode {
    return h('div', { class: { content: true } }, children);
}
