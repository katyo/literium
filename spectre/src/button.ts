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
    clear?: boolean;
    label?: VNodeChildren;
    href?: string;
    off?: boolean;
    ddtg?: boolean; // dropdown toggle
    click?: () => void;
}

export function button({ kind, size, float, valid, action, circle, loading, clear, label, href, off, ddtg, click }: ButtonProps): VNode {
    return h(href ? 'a' : 'button', {
        attrs: {
            href,
            disabled: off,
            tabindex: ddtg ? 0 : undefined
        },
        class: {
            btn: true,
            [`btn-${kind}`]: asBool(kind),
            [`btn-${valid ? 'success' : 'error'}`]: valid != undefined,
            [`btn-clear`]: asBool(clear),
            [`btn-${size}`]: asBool(size),
            [`float-${float}`]: asBool(float),
            'btn-action': asBool(action),
            circle: asBool(circle),
            loading: asBool(loading),
            'dropdown-toggle': asBool(ddtg),
        },
        on: { click }
    }, label);
}
