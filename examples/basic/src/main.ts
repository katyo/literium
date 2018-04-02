import { Component, Fork, Send, Keyed, h, page, fork_wrap, send_wrap } from 'literium';
import { hasJsScript } from 'literium-runner';

import hello from './apps/hello';
import counter from './apps/counter';
import greeting from './apps/greeting';
import chats from './apps/chats';
import editor from './apps/editor';

const styles = [
    { link: `client_${process.env.npm_package_version}.min.css` }
];

const scripts = [
    { data: hasJsScript() },
    { link: `client_${process.env.npm_package_version}.min.js` }
];

const settings = {
    'viewport': 'width=device-width,initial-scale=1,user-scalable=no,maximum-scale=1',
    'apple-mobile-web-app-capable': 'yes',
    'apple-touch-fullscreen': 'yes',
};

const apps: [string, Component<any, any>][] = [
    ["Hello", hello],
    ["Counter", counter],
    ["Greeting", greeting],
    ["Chats", chats],
    ["Editor", editor],
];

export interface State {
    appId: number;
    appState: any;
}

export interface SelectApp {
    $: 'select';
    appId: number;
}

export type Event = SelectApp | Keyed<'app', any>;

const fork_app = fork_wrap<'app', Event>('app');
const send_app = send_wrap<'app', Event>('app');

export function main(fastrun: boolean): Component<State, Event> {
    function create(fork: Fork<Event>) {
        return {
            appId: 0,
            appState: fastrun ? undefined : apps[0][1].create(fork_app(fork))
        };
    }

    function update(state: State, event: Event, fork: Fork<Event>) {
        switch (event.$) {
            case 'app': return {
                ...state,
                appState: apps[state.appId][1].update(state.appState, event._, fork_app(fork))
            };
            case 'select': return {
                appId: event.appId,
                appState: apps[event.appId][1].create(fork_app(fork))
            };
        }
    }

    function render({ appId, appState }: State, send: Send<Event>) {
        return page({
            styles,
            scripts,
            settings,
        }, fastrun ? [] : [
            h('div.wrapper-small', [
                h('p', apps.map(([title,], appId_) => h('button', {
                    key: appId_,
                    class: { 'btn--secondary': appId != appId_ },
                    on: { click: () => { if (appId != appId_) { send({ $: 'select', appId: appId_ }); } } }
                }, title))),
                h('h2', apps[appId][0]),
            ]),
            apps[appId][1].render(appState, send_app(send))
        ]);
    }

    return { create, update, render };
}
