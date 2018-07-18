import { VNode, VNodeChildren, VNodeChild, h } from 'literium';
import { WidgetSize, asBool } from './widget';

export interface FormGroupProps {
    id: string;
    size?: WidgetSize;
    hint?: VNodeChildren;
    label?: VNodeChildren;
    valid?: boolean;
    off?: boolean;
}

export function formGroup({ label, size, id, hint, valid }: FormGroupProps, children: VNodeChild[]): VNode {
    return h('div', { class: { 'form-group': true, [`has-${valid ? 'success' : 'error'}`]: valid != undefined } }, [
        ...(label ? [h('div', {
            class: { 'form-label': true, [`label-${size}`]: asBool(size) },
            attrs: { for: id }
        }, label)] : []),
        ...children,
        ...(hint ? [h('div', { class: { 'form-input-hint': true } }, hint)] : [])
    ]);
}

export function formValid<LangCode, Props extends FormGroupProps>(lang: LangCode, result: ((lang: LangCode) => string) | true | undefined, props: Props): Props {
    if (result === true) {
        props.valid = true;
    } else if (result !== undefined) {
        props.valid = false;
        props.hint = (props.hint ? ' ' : '') + result(lang);
    }
    return props;
}
