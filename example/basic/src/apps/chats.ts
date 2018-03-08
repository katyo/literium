import { Component, Send, send_map, h } from 'literium/types';
import * as Chat from './chat';

export interface State {
    chats: Chat.State[];
}

export interface ChatEvent {
    $: 'chat';
    chat: number;
    event: Chat.Event;
}

export type Event = ChatEvent;

function create(): State {
    const john = Chat.update(Chat.create(), { $: 'login', user: 'John' });
    const maria = Chat.update(Chat.create(), { $: 'login', user: 'Maria' });
    const other = Chat.create();
    return { chats: [john, maria, other] };
}

function update(state: State, event: Event): State {
    switch (event.$) {
        case 'chat':
            if (event.event.$ == 'reply') {
                return {
                    ...state,
                    chats: state.chats.map(chat => Chat.update(chat, event.event))
                };
            }
            return {
                ...state,
                chats: state.chats.map((chat, $) =>
                    $ == event.chat ? Chat.update(chat, event.event) : chat)
            };
    }
    return state;
}

function render({ chats }: State, send: Send<Event>) {
    const chat_send = ($: number) => send_map(send, event => ({ $: 'chat', chat: $, event }));
    return h('div.wrapper-small.grid', chats.map((chat, $) => Chat.render(chat, chat_send($))));
}

const app: Component<State, Event> = { create, update, render };

export default app;
