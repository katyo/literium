import { VNodeChildren, VNodeChild, h } from 'literium';
import { Renderer } from 'highlight-ts';

export const vdomRender: Renderer<VNodeChildren> = {
    text: (chunk: string) => chunk,
    join: (chunks: VNodeChild[]) => chunks,
    wrap: (className: string, chunk: VNodeChildren) => h('span', { class: { [className]: true } }, chunk)
};
