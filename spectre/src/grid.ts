import { do_seq, flat_map } from '@literium/base';
import { VNodeChildren, VNode, h } from '@literium/core';
import { asBool } from './widget';

export interface ContainerProps {
    rows: RowProps[];
}

export interface RowProps {
    gapless?: boolean;
    outline?: boolean;
    columns: ColumnProps[];
}

export const enum ColumnMargin {
    Left = 'l',
    Right = 'r',
    Both = 'x',
}

export type ColumnWidth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface ColumnProps {
    margin?: ColumnMargin;
    xs?: ColumnWidth;
    sm?: ColumnWidth;
    md?: ColumnWidth;
    lg?: ColumnWidth;
    xl?: ColumnWidth;
    sz: ColumnWidth;
    content: VNodeChildren;
}

export function grid({ rows }: ContainerProps): VNode {
    return h('div', { class: { container: true } }, do_seq(
        rows,
        flat_map(({ gapless, outline, columns }) => h('div', {
            class: {
                columns: true,
                'col-gapless': asBool(gapless),
                'col-outline': asBool(outline),
            }
        }, do_seq(
            columns,
            flat_map(({ margin, content, xs, sm, md, lg, xl, sz }) => h('div', {
                class: {
                    column: true,
                    [`col-m${margin}-auto`]: asBool(margin),
                    [`col-xs-${xs}`]: asBool(xs),
                    [`col-sm-${sm}`]: asBool(sm),
                    [`col-md-${md}`]: asBool(md),
                    [`col-lg-${lg}`]: asBool(lg),
                    [`col-xl-${xl}`]: asBool(xl),
                    [`col-${sz}`]: asBool(sz),
                }
            }, content))
        )))
    ));
}
