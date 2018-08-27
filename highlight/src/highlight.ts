import { VNodeChildren } from '@literium/core';
import { Options, init, process } from 'highlight-ts';
import { vdomRender } from './vdom';

export interface Highlight {
    (src: string, lang?: string | string[]): VNodeChildren;
}

export function initHighlight(options?: Options): Highlight {
    const highlighter = init(vdomRender, options);

    return (src, lang) => {
        const result = process(highlighter, src, lang);
        return result.value;
    };
}
