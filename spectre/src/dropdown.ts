import { flat_all } from '@literium/base';
import { VNode, h } from '@literium/core';
import { WidgetFloat, asBool } from './widget';
import { ButtonProps, button } from './button';
import { MenuEntry, menu } from './menu';
import { IconKind, icon } from './icon';

export interface DropdownProps {
    button: ButtonProps;
    caret?: ButtonProps;
    float?: WidgetFloat;
    entries: MenuEntry[];
}

export function dropdown({ button: btn, caret, float, entries }: DropdownProps): VNode {
    return h('div', {
        class: {
            dropdown: true,
            'dropdown-right': float == WidgetFloat.Right,
            [`float-${float}`]: asBool(float)
        }
    }, caret ? h('div', { class: { 'btn-group': true } }, [
        button(btn),
        button({ ...caret, ddtg: true, label: caret.label || icon({ kind: IconKind.Caret }) }),
        menu(entries)
    ]) : [
                button({
                    ...btn,
                    ddtg: true,
                    label: flat_all(
                        btn.label,
                        icon({ kind: IconKind.Caret })
                    )
                }),
                menu(entries)
            ]);
}
