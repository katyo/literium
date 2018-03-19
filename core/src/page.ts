import { h, VNode, VNodeChildren, VData } from './vdom';
import { empty, flat_all } from './core';

export interface ResourceLink {
    link: string;
};

export interface ResourceData {
    data: string;
};

export type Resource = ResourceLink | ResourceData;

export interface Props {
    styles: Resource[];
    scripts: Resource[];
    charset: string;
    compat: string;
    settings: Record<string, string>;
    title: string;
    description: string;
    author: string;
    keywords: string[];
    baseHref: string;
    baseTarget: string;
    body?: VData;
};

const defaults: Props = {
    styles: [],
    scripts: [],
    charset: 'UTF-8',
    compat: 'IE=edge,chrome=1',
    settings: {
        //viewport: 'width=device-width initial-scale=1 user-scalable=no',
        viewport: 'width=device-width,initial-scale=1,user-scalable=no,maximum-scale=1',
        'apple-mobile-web-app-capable': 'yes',
        'apple-touch-fullscreen': 'yes',
    },
    title: '',
    description: '',
    author: '',
    keywords: [],
    baseHref: '',
    baseTarget: '',
};

export function page(props: Partial<Props>, nodes: VNodeChildren): VNode {
    const { scripts, styles, charset, compat, settings,
        title, description, author, keywords, baseHref, baseTarget, body }: Props = { ...defaults, ...props };

    const style_nodes = styles.map(res => 'link' in res ?
        h('link', { attrs: { href: (res as ResourceLink).link, rel: 'stylesheet' } }) :
        h('style', (res as ResourceData).data));

    const script_nodes = scripts.map(res => 'link' in res ?
        h('script', { attrs: { src: (res as ResourceLink).link } }) :
        h('script', (res as ResourceData).data));

    return h('html', [
        h('head', flat_all(
            h('meta', { attrs: { charset } }),
            h('meta', { attrs: { 'http-equip': 'X-UA-Compatible', content: compat } }),
            Object.keys(settings).map(name => h('meta', { attrs: { name, content: settings[name] } })),
            style_nodes,
            (keywords && keywords.length > 0 ? [h('meta', { attrs: { name: 'keywords', content: keywords.join(' ') } })] : []),
            (baseHref || baseTarget ? [h('base', { attrs: { href: baseHref, target: baseTarget } })] : []),
            (description ? [h('meta', { attrs: { name: 'description', content: description as string } })] : []),
            (author ? [h('meta', { attrs: { name: 'author', content: author as string } })] : []),
            (title ? [h('title', title as string)] : []),
        )),
        h('body', body || empty, flat_all(nodes, script_nodes))
    ]);
}
