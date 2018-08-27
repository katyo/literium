import { VNodeChildren } from '@literium/core';
import { Options, listLanguages, init, process } from 'highlight-ts';
import { vdomRender } from './vdom';

export interface Highlight {
    (src: string, lang?: string | string[]): [VNodeChildren, string];
}

export function initHighlight(options?: Options): Highlight {
    const highlighter = init(vdomRender, options);

    return (src, lang) => {
        if (lang) {
            const langs = listLanguages();
            // remove unsupported languages to prevent fault
            if (typeof lang == 'string') {
                if (langs.indexOf(lang) < 0) lang = undefined;
            } else {
                lang = lang.filter(lang => langs.indexOf(lang) >= 0);
            }
        }
        const { value, language } = process(highlighter, src, lang);
        return [value, language];
    };
}
