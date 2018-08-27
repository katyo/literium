import { VNode, VNodeChildren, h } from '@literium/core';
import { asBool } from './widget';

export interface TableProps {
    striped?: boolean;
    scroll?: boolean;
    hover?: boolean;
    active?: number;
    header?: VNodeChildren[];
    body?: VNodeChildren[][];
    footer?: VNodeChildren[];
}

export function table({ striped, scroll, hover, active, header, body, footer }: TableProps): VNode {
    return h('table', {
        class: {
            table: true,
            'table-striped': asBool(striped),
            'table-scroll': asBool(scroll),
            'table-hover': typeof hover == 'number'
        }
    }, [
            ...(header ? [h('thead', h('tr', header.map(cell => h('th', cell))))] : []),
            ...(body ? [h('tbody', body.map((row, num) => h('tr', { class: { active: active === num } }, row.map(cell => h('td', cell)))))] : []),
            ...(footer ? [h('tfoot', h('tr', footer.map(cell => h('th', cell))))] : [])
        ]);
}
