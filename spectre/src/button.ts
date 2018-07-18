import { VNode, VNodeChildren, h } from 'literium';
import { WidgetSize, WidgetFloat, asBool } from './widget';

export const enum ButtonKind {
    Outline = '',
    Primary = 'primary',
    Link = 'link',
}

export interface ButtonProps {
    kind?: ButtonKind;
    size?: WidgetSize;
    float?: WidgetFloat;
    valid?: boolean;
    action?: boolean;
    circle?: boolean;
    loading?: boolean;
    label?: VNodeChildren;
    href?: string;
    off?: boolean;
    click?: () => void;
}

export function button({ kind, size, float, valid, action, circle, loading, label, href, off, click }: ButtonProps): VNode {
    return h(href ? 'a' : 'button', {
        attrs: { disabled: off },
        class: {
            btn: true,
            [`btn-${kind}`]: asBool(kind),
            [`btn-${valid ? 'success' : 'error'}`]: valid != undefined,
            [`btn-${size}`]: asBool(size),
            [`float-${float}`]: asBool(float),
            'btn-action': asBool(action),
            circle: asBool(circle),
            loading: asBool(loading),
        },
        on: { click: click as () => void }
    }, label);
}
