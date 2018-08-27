import { VNode, VNodeChildren, h } from '@literium/core';
import { WidgetSize, asBool } from './widget';

export interface ModalProps {
    size?: WidgetSize;
    active?: boolean;
    header?: VNodeChildren;
    body?: VNodeChildren;
    footer?: VNodeChildren;
    title?: VNodeChildren;
    close?: () => void;
}

export function modal({ size, active, header, body, footer, title, close }: ModalProps): VNode {
    const on = close ? {
        click: (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            close();
        }
    } : undefined;

    return h('div', {
        class: {
            modal: true,
            active: asBool(active),
            [`modal-${size}`]: asBool(size)
        }
    }, [
            h('a', {
                on,
                attrs: { href: '#close', 'aria-label': "Close" },
                class: { 'modal-overlay': true }
            }),
            h('div', { class: { 'modal-container': true } }, [
                ...(header || title ? [h('div', { class: { 'modal-header': true } },
                    header || [
                        h('a', {
                            on,
                            attrs: { href: '#close', 'aria-label': "Close" },
                            class: { btn: true, 'btn-clear': true, 'float-right': true }
                        }),
                        h('div', { class: { 'modal-title': true } }, title)
                    ])] : []),
                ...(body ? [h('div', { class: { 'modal-body': true } }, body)] : []),
                ...(footer ? [h('div', { class: { 'modal-footer': true } }, footer)] : []),
            ])
        ]);
}
