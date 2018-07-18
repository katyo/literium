import { VNode, h } from 'literium';
import { asBool } from './widget';
import { FormGroupProps, formGroup } from './form';

export const enum ComboKind {
    Select,
    Radio,
    Check,
    Switch
}

export interface ComboProps extends FormGroupProps {
    kind?: ComboKind;
    options: Record<string, string>;
    empty?: boolean; // allow empty selection
    multi?: boolean; // allow multiple selection
    values?: string[];
    change?: (values: string[]) => void;
}

export function combo(props: ComboProps): VNode {
    const { kind, size, id, options, empty, multi, change, off } = props;

    const keys: string[] = Object.keys(options);
    let values: string[] = props.values || (empty ? [] : [keys[0]]);
    const inputs: VNode[] = [];

    const update = change ? (e: MouseEvent) => {
        const selected: string[] = [];

        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i].elm;
            if ((input as HTMLOptionElement).selected || (input as HTMLInputElement).checked) {
                selected.push(keys[i]);
            }
        }

        change(selected);
    } : undefined;

    return formGroup(props, kind == ComboKind.Select ? [
        h('select', {
            class: { 'form-input': true, [`input-${size}`]: asBool(size) },
            attrs: {
                id,
                disabled: off,
                multiple: multi || empty,
            }
        }, keys.map(key => {
            const selected = values ? values.indexOf(key) != -1 : undefined;

            const input = h('option', {
                props: { selected },
                attrs: { selected },
                on: { select: update as () => void },
            }, options[key]);

            inputs.push(input);

            return input;
        }))
    ] : keys.map(key => {
        const checked = values ? values.indexOf(key) != -1 : undefined;

        const input = h('input', {
            attrs: {
                type: kind == ComboKind.Radio ? 'radio' : 'checkbox',
                checked,
                disabled: off,
            },
            props: { checked },
            on: {
                click: (e: MouseEvent) => {
                    const elm = e.target as HTMLInputElement;

                    if (multi || empty) { // toggle
                        const i = values.indexOf(key);

                        if (i == -1) { // add
                            values = keys.filter(k => k == key || values.indexOf(k) != -1);
                            elm.checked = true;
                            elm.setAttribute('checked', '');
                        } else { // remove
                            values.splice(i, 1);
                            elm.checked = false;
                            elm.removeAttribute('checked');
                        }
                    } else {
                        const n = keys.indexOf(key);

                        for (let i = 0; i < inputs.length; i++) {
                            if (i != n) {
                                (inputs[i].elm as HTMLInputElement).checked = false;
                            }
                        }

                        elm.checked = true;
                    }
                    if (update) update(e);
                },
            },
        });

        inputs.push(input);

        return h('label', {
            class: {
                [`form-${kind == ComboKind.Radio ? 'radio' : kind == ComboKind.Switch ? 'switch' : 'checkbox'}`]: true
            },
        }, [
                input,
                h('i', { class: { 'form-icon': true } }),
                ` ${options[key]}`
            ]);
    }));
}
