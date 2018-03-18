import { Plugin, Compiler } from 'webpack';
import { Component } from 'literium';
import { init } from './server';

export interface RenderHtmlAsset<State, Event> {
    filename?: string;
    view: Component<State, Event>;
}

export interface RenderHtmlOptions<State, Event> {
    doctype: string;
    timeout: 1000,
    assets: RenderHtmlAsset<State, Event>[];
}

export const defaults: RenderHtmlOptions<any, any> = {
    doctype: 'html',
    timeout: 1000,
    assets: [],
};

export class RenderHtmlPlugin<State, Event> implements Plugin {
    private options: RenderHtmlOptions<State, Event>;
    constructor(options: Partial<RenderHtmlOptions<State, Event>>) {
        this.options = { ...defaults, ...options };
    }
    apply(compiler: Compiler): void {
        compiler.plugin("emit", this.emit.bind(this));
    }
    emit(compilation: any, callback: () => void): void {
        const { doctype, timeout, assets } = this.options;
        if (assets.length == 0) {
            callback();
            return;
        }
        const render = init(doctype, timeout);
        let pending = 0;
        for (const asset of assets) {
            pending++;
            (({ filename, view }) => {
                render(view, (html) => {
                    pending--;
                    compilation.assets[filename || "index.html"] = {
                        source: () => html,
                        size: () => html.length
                    };
                    if (pending == 0) {
                        callback();
                    }
                });
            })(asset);
        }
    }
}
