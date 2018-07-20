import { VNode, VNodeChildren, h } from 'literium';
import { asBool } from './widget';

export const enum ToastKind {
    Primary = 'primary',
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
}

export interface ToastProps {
    active?: boolean;
    kind?: ToastKind;
    close?: () => void;
    content: VNodeChildren;
}

export function toast({ active, kind, close, content }: ToastProps): VNode {
    return h('div', {
        class: { toast: true, [`toast-${kind}`]: asBool(kind) },
        style: { display: active ? '' : 'none' }
    }, [
            ...(close ? [h('button', {
                class: { btn: true, 'btn-clear': true, 'float-right': true },
                on: { click: close }
            })] : []),
            h('div', content),
        ]);
}
