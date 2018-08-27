import { mk_seq } from '@literium/base';
import { VNodeChildren } from '@literium/core';
import {
    HasMeta, HasContexts,
    ContextMeta,
    ParserRules, init, parse,
    ParserResult,
    RenderRules, render,
    HasInit, InitTag
} from 'marklit';
import { initRenderVDom } from './render/vdom';

export interface Markup<CtxMap extends HasMeta> {
    (src: string): [ContextMeta<CtxMap>, VNodeChildren];
}

export interface ProcessFunc<CtxMap extends HasMeta & HasContexts & HasInit> {
    (res: ParserResult<CtxMap, InitTag>): ParserResult<CtxMap, InitTag>;
}

export function initMarkup<CtxMap extends HasMeta & HasContexts & HasInit>(parse_rules: ParserRules<CtxMap, ContextMeta<CtxMap>>, render_rules: RenderRules<VNodeChildren, CtxMap>, process_fns: ProcessFunc<CtxMap>[] = []): Markup<CtxMap> {
    const parser = init<CtxMap>(...parse_rules);
    const process = (mk_seq as any)(...process_fns);
    const renderer = initRenderVDom<CtxMap>(...render_rules);
    return (src: string) => {
        const result = process(parse(parser, src));
        return [result[0], render(renderer, result)];
    };
}
