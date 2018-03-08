import { VNode, Send, h } from 'literium/types';
import { KeyCode } from 'literium/keys';

export interface Msg {
    user: string;
    text: string;
}

export interface State {
    user?: string;
    msgs: Msg[];
    blocked: string[];
}

export interface Login {
    $: 'login';
    user: string;
}

export interface Reply {
    $: 'reply';
    msg: Msg;
}

export interface Block {
    $: 'block';
    user: string;
}

export interface Unblock {
    $: 'unblock';
    user: string;
}

export interface Clear {
    $: 'clear';
}

export type Event = Login | Reply | Block | Unblock | Clear;

export function create() {
    return { msgs: [], blocked: [] } as State;
}

export function update(state: State, event: Event): State {
    switch (event.$) {
        case 'login':
            return { ...state, user: event.user };
        case 'reply':
            if (state.blocked.indexOf(event.msg.user) != -1) return state;
            return { ...state, msgs: [...state.msgs, event.msg] };
        case 'block':
            return {
                ...state, blocked: [...state.blocked, event.user],
                msgs: state.msgs.filter(msg => msg.user != event.user)
            };
        case 'unblock':
            return { ...state, blocked: state.blocked.filter(user => user != event.user) };
        case 'clear':
            return { ...state, msgs: [] };
    }
    return state;
}

export function render({ user, msgs, blocked }: State, send: Send<Event>): VNode {
    return h('div.chat', [
        h('dl.msgs', (() => {
            const out = [];
            for (let msg of msgs) {
                out.push(h('dt', {
                    on: {
                        dblclick: () => {
                            if (msg.user != user) send({ $: 'block', user: msg.user });
                        }
                    }
                }, msg.user == user ? h('strong', msg.user) : msg.user));
                out.push(h('dd', msg.text));
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
                                    send({ $: 'reply', msg: { user, text } });
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
                                        send({ $: 'login', user });
                                    }
                                }
                            }
                        }
                    }),
                    h('span.textfield__label', 'Nickname')
                ]),
        blocked.length ? h('div', [
            h('p', 'Blocked users:'),
            h('ul', blocked.map(user => h('li', { on: { dblclick: () => { send({ $: 'unblock', user }); } } }, user))),
            h('p.fs-small', 'Double click on nickname to unblock user')
        ]) : h('p.fs-small', 'Double click on nickname to block user'),
    ]);
}
