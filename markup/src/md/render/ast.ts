import { InlineToken } from '../inline/token';
import { BlockToken } from '../block/token';
import { Renderer } from '../parser';

// Break types to avoid cyclic type-references
export type AstBlockToken = BlockToken<any>;
export type AstInlineToken = InlineToken<any>;
export type AstToken = AstBlockToken | AstInlineToken;

function block(block: AstBlockToken): AstBlockToken {
    return block;
}

function inline(inline: AstInlineToken): AstInlineToken {
    return inline;
}

export const astRender: Renderer<AstToken> = { block, inline };
