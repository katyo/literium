import { VNode, VNodeChildren, h } from '@literium/core';

export interface NavbarProps {
    left?: VNodeChildren;
    center?: VNodeChildren;
    right?: VNodeChildren;
}

export function navbar({ left, center, right }: NavbarProps): VNode {
    return h('div', { class: { navbar: true } }, [
        left ? h('div', { class: { 'navbar-section': true } }, left) : undefined,
        center ? h('div', { class: { 'navbar-center': true } }, center) : undefined,
        right ? h('div', { class: { 'navbar-section': true } }, right) : undefined
    ]);
}
