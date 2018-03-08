import { Component, Fork, Send, h, fork_map, send_map } from 'literium/types';
import { page } from 'literium/page';

import hello from './apps/hello';
import counter from './apps/counter';
import greeting from './apps/greeting';
import chats from './apps/chats';

const styles = [{ link: `client_${process.env.npm_package_version}.min.css` }];
const scripts = [{ link: `client_${process.env.npm_package_version}.min.js` }];

const apps: [string, Component<any, any>][] = [
    ["Hello world", hello],
    ["Counter", counter],
    ["Greeting", greeting],
    ["Chats", chats],
];

export interface State {
    appId: number;
    appState: any;
}

export interface SelectApp {
    $: 'select';
    appId: number;
}

export interface AppEvent {
    $: 'app';
    event: any;
}

function appEvent(event: any): Event {
    return { $: 'app', event };
}

export type Event = SelectApp | AppEvent;

function create(fork: Fork<Event>) {
    return {
        appId: 0,
        appState: apps[0][1].create(fork_map(fork, appEvent))
    };
}

function update(state: State, event: Event, fork: Fork<Event>) {
    switch (event.$) {
        case 'app': return {
            ...state,
            appState: apps[state.appId][1].update(state.appState, event.event, fork_map(fork, appEvent))
        };
        case 'select': return {
            appId: event.appId,
            appState: apps[event.appId][1].create(fork_map(fork, appEvent))
        };
    }
}

function render({ appId, appState }: State, send: Send<Event>) {
    return page({
        styles,
        scripts,
    }, [
            h('div.wrapper-small', [
                h('p', apps.map(([title,], appId_) => h('button', {
                    key: appId_,
                    class: { 'btn--secondary': appId != appId_ },
                    on: { click: () => { if (appId != appId_) { send({ $: 'select', appId: appId_ }); } } }
                }, title))),
                h('h2', apps[appId][0]),
            ]),
            apps[appId][1].render(appState, send_map(send, appEvent))
        ]);
}

export const main: Component<State, Event> = { create, update, render };
