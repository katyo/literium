import { VNode, VNodeChildren, h } from 'literium';

export interface MenuDivider { }

export interface MenuCaption {
    label: string;
}

export interface MenuElement {
    content: VNodeChildren;
}

export type MenuEntry = MenuDivider | MenuCaption | MenuElement;

export function menu(entries: MenuEntry[]): VNode {
    return h('ul', { class: { menu: true } },
        entries.map(entry => (entry as MenuCaption).label ?
            h('li', {
                class: { divider: true },
                attrs: { 'data-content': (entry as MenuCaption).label }
            }) :
            (entry as MenuElement).content ?
                h('li', {
                    class: { 'menu-item': true }
                }, (entry as MenuElement).content) :
                h('li', { class: { divider: true } })));
}
