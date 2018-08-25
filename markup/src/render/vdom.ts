import { VNodeChildren, VNodeChild, flat_all } from 'literium';
import {
    RenderRule, RenderHandle, makeRender,
    ContextTag, ContextMap,
    UnknownToken, NoMeta
} from 'marklit';

export type InlineRenderRuleVDom<InlineTokenMap, Meta> = RenderRule<VNodeChildren, ContextMap<UnknownToken, InlineTokenMap, any>, ContextTag.Inline, Meta>;

export type InlineRenderHandleVDom<InlineTokenMap, Meta> = RenderHandle<VNodeChildren, ContextMap<UnknownToken, InlineTokenMap, any>, ContextTag.Inline, Meta>;

export type BlockRenderRuleVDom<BlockTokenMap, Meta> = RenderRule<VNodeChildren, ContextMap<BlockTokenMap, UnknownToken, any>, ContextTag.Block, Meta>;

export type BlockRenderHandleVDom<BlockTokenMap, Meta> = RenderHandle<VNodeChildren, ContextMap<BlockTokenMap, UnknownToken, any>, ContextTag.Block, Meta>;

export const initRenderVDom = makeRender(joinVNode);

export function wrapVNode($: RenderHandle<VNodeChildren, ContextMap<UnknownToken, UnknownToken, NoMeta>, ContextTag, NoMeta>, chunk: string): VNodeChildren {
    return chunk;
}

export function joinVNode($: RenderHandle<VNodeChildren, ContextMap<UnknownToken, UnknownToken, NoMeta>, ContextTag, NoMeta>, chunks: VNodeChildren[]): VNodeChildren {
    return flat_all(chunks as VNodeChild[]);
}
