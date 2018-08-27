import { Emit, Keyed, AsKeyed } from '@literium/base';
import { VNode, h, KeyCode } from '@literium/core';

export type Props = void;

export interface State {
    user?: string;
    msgs: Keyed<string /* user name */, string /* phrase */>[];
    blocked: string[];
}

export type Signal = AsKeyed<{
    login: string; /* user name */
    reply: Keyed<string /* user name */, string /* phrase */>; /* message */
    block: string; /* user name */
    unblock: string; /* user name */
    clear: void;
}>;

export function create(_props: Props) {
    return { msgs: [], blocked: [] } as State;
}

export function update(_props: Props, state: State, signal: Signal): State {
    switch (signal.$) {
        case 'login':
            return { ...state, user: signal._ };
        case 'reply':
            if (state.blocked.indexOf(signal._.$) != -1) return state;
            return { ...state, msgs: [...state.msgs, signal._] };
        case 'block':
            return {
                ...state, blocked: [...state.blocked, signal._],
                msgs: state.msgs.filter(msg => msg.$ != signal._)
            };
        case 'unblock':
            return { ...state, blocked: state.blocked.filter(user => user != signal._) };
        case 'clear':
            return { ...state, msgs: [] };
    }
    return state;
}

export function render(_props: Props, { user, msgs, blocked }: State, emit: Emit<Signal>): VNode {
    return h('div.chat', [
        h('dl.msgs', (() => {
            const out = [];
            for (let msg of msgs) {
                out.push(h('dt', {
                    on: {
                        dblclick: () => {
                            if (msg.$ != user) emit({ $: 'block', _: msg.$ });
                        }
                    }
                }, msg.$ == user ? h('strong', msg.$) : msg.$));
                out.push(h('dd', msg._));
            }
            return out;
        })()),
        h('label.textfield',
            user ? [
                h('input', {
                    attrs: { type: 'text', placeholder: 'Reply' },
                    on: {
                        keydown: e => {
                            if (e.keyCode == KeyCode.Enter) {
                                const field = e.target as HTMLInputElement;
                                const text = field.value;
                                if (text) {
                                    field.value = '';
                                    emit({ $: 'reply', _: { $: user, _: text } });
                                }
                            }
                        }
                    }
                }),
                h('span.textfield__label', user)
            ] : [
                    h('input', {
                        attrs: { type: 'text', placeholder: 'Enter your name' },
                        on: {
                            keydown: e => {
                                if (e.keyCode == KeyCode.Enter) {
                                    const field = e.target as HTMLInputElement;
                                    const user = field.value;
                                    if (user) {
                                        field.value = '';
                                        emit({ $: 'login', _: user });
                                    }
                                }
                            }
                        }
                    }),
                    h('span.textfield__label', 'Nickname')
                ]),
        blocked.length ? h('div', [
            h('p', 'Blocked users:'),
            h('ul', blocked.map(user => h('li', { on: { dblclick: () => { emit({ $: 'unblock', _: user }); } } }, user))),
            h('p.fs-small', 'Double click on nickname to unblock user')
        ]) : h('p.fs-small', 'Double click on nickname to block user'),
    ]);
}
