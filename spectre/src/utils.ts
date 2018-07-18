import { VNode, VNodeChildren, h } from 'literium';
import { WidgetSize, asBool } from './widget';

export interface LoadingProps {
    size?: WidgetSize;
}

export function loading({ size }: LoadingProps): VNode {
    return h('div', { class: { loading: true, [`loading-${size}`]: asBool(size) } });
}

export interface ChipProps {
    inline?: boolean;
    content: VNodeChildren;
}

export function chip({ inline, content }: ChipProps): VNode {
    return h(inline ? 'span' : 'div', { class: { chip: true } }, content);
}
