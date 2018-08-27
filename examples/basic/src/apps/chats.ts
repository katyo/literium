import { Emit, map_emit, Keyed, AsKeyed } from '@literium/base';
import { Component, h } from '@literium/core';
import * as Chat from './chat';

export type Props = void;

export interface State {
    chats: Chat.State[];
}

export type Signal = AsKeyed<{
    chat: Keyed<number, Chat.Signal>;
}>;

function create(props: Props): State {
    const john = Chat.update(props, Chat.create(props), { $: 'login', _: 'John' });
    const maria = Chat.update(props, Chat.create(props), { $: 'login', _: 'Maria' });
    const other = Chat.create(props);
    return { chats: [john, maria, other] };
}

function update(props: Props, state: State, signal: Signal): State {
    switch (signal.$) {
        case 'chat':
            if (signal._._.$ == 'reply') {
                return {
                    ...state,
                    chats: state.chats.map(chat => Chat.update(props, chat, signal._._))
                };
            }
            return {
                ...state,
                chats: state.chats.map((chat, $) =>
                                       $ == signal._.$ ? Chat.update(props, chat, signal._._) : chat)
            };
    }
    return state;
}

function render(props:Props, { chats }: State, emit: Emit<Signal>) {
    const chat_emit = ($: number) => map_emit(signal => ({ $: 'chat', _: { $, _: signal } }))(emit);
    return h('div.wrapper-small.grid', chats.map((chat, $) => Chat.render(props, chat, chat_emit($))));
}

export default {create, update, render} as Component<Props, State, Signal>;
