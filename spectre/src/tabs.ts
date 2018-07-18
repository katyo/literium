import { VNode, VNodeChildren, h } from 'literium';

export interface TabsProps<Key> {
    active?: Key;
    block?: boolean;
    links?: boolean;
    tabs: TabProps<Key>[];
    select?: (key: Key) => void
}

export interface TabProps<Key> {
    key?: Key;
    action?: boolean;
    label: VNodeChildren;
}

export function tabs<Key>({ active, block, links, tabs, select }: TabsProps<Key>): VNode {
    return h('ul', { class: { tab: true, 'tab-block': !!block } },
        tabs.map(({ key, action, label }: TabProps<Key>) =>
            h('li', {
                class: { 'tab-item': true, active: key === active, 'tab-action': !!action },
                on: select && key != null ? { click: (e) => { e.stopPropagation(); e.preventDefault(); select(key); } } : undefined
            }, links && !action ? h('a', { attrs: { href: 'javascript:' } }, label) : label)));
}
