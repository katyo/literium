import { Emit, Spawn, PairedAsKeyed, key_emit } from '@literium/base';
import { Component, h, page } from '@literium/core';
import { hasJsScript } from '@literium/runner';

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

const apps: [string, Component<any, any, any>][] = [
    ["Hello", hello],
    ["Counter", counter],
    ["Greeting", greeting],
    ["Chats", chats],
    ["Editor", editor],
];

export interface Props {
    fast: boolean;
}

export interface State {
    appId: number;
    appState: any;
}

export interface SelectApp {
    $: 'select';
    appId: number;
}

export type Signal = PairedAsKeyed<{
    select: number /* app id */,
    app: any /* app state */
}>;

const emit_app = key_emit('app');

function create(props: Props, emit: Emit<Signal>, spawn: Spawn) {
    return {
        appId: 0,
        appState: props.fast ? undefined : apps[0][1].create(props, emit_app(emit), spawn)
    };
}

function update(props: Props, state: State, signal: Signal, emit: Emit<Signal>, spawn: Spawn) {
    switch (signal.$) {
        case 'app': return {
            ...state,
            appState: apps[state.appId][1].update(props, state.appState, signal._, emit_app(emit), spawn)
        };
        case 'select': return {
            appId: signal._,
            appState: apps[signal._][1].create(props, emit_app(emit), spawn)
        };
    }
}

function render(props: Props, { appId, appState }: State, emit: Emit<Signal>) {
    return page({
        styles,
        scripts,
        settings,
    }, props.fast ? [] : [
        h('div.wrapper-small', [
            h('p', apps.map(([title,], appId_) => h('button', {
                key: appId_,
                class: { 'btn--secondary': appId != appId_ },
                on: { click: () => { if (appId != appId_) { emit({ $: 'select', _: appId_ }); } } }
            }, title))),
            h('h2', apps[appId][0]),
        ]),
        apps[appId][1].render(props, appState, emit_app(emit))
    ]);
}

export const main: Component<Props, State, Signal> = { create, update, render };
