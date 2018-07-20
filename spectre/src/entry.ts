import { VNode, h } from 'literium';
import { asBool } from './widget';
import { FormGroupProps, formGroup } from './form';

export const enum EntryKind {
    Field,
    Password,
    Area,
}

export interface EntryProps extends FormGroupProps {
    kind?: EntryKind;
    ghost?: string;
    value?: string;
    start?: number;
    end?: number;
    change?: (value: string, start: number, end: number) => void;
    focus?: (value: string, start: number, end: number) => void;
    blur?: (value: string, start: number, end: number) => void;
}

export function entry(props: EntryProps): VNode {
    const { kind, size, id, ghost, start, end, change, focus, blur, off } = props;
    let { value } = props;

    const send = (e: Event, fn: (value: string, start: number, end: number) => void) => {
        const elm = e.target as HTMLInputElement;
        fn(elm.value, elm.selectionStart || 0, elm.selectionEnd || 0);
    };

    const on_input = change ? (e: KeyboardEvent) => { send(e, change); } : undefined;

    return formGroup(props, [
        h(kind == EntryKind.Area ? 'textarea' : 'input', {
            class: { 'form-input': true, [`input-${size}`]: asBool(size) },
            attrs: {
                id,
                type: kind == EntryKind.Password ? 'password' :
                    kind == EntryKind.Area ? undefined : 'text',
                placeholder: ghost,
                value,
                disabled: off
            },
            props: { value, selectionStart: start, selectionEnd: end },
            on: {
                input: on_input,
                change: on_input,
                focus: focus ? (e: Event) => { send(e, focus); } : undefined,
                blur: blur ? (e: Event) => { send(e, blur); } : undefined,
            }
        })
    ]);
}
