import { block_normal, block_gfm, block_gfm_tables } from './block/rules';
import { inline_normal, inline_pedantic, inline_gfm, inline_gfm_breaks } from './inline/rules';

import { RuleSet } from './parser';

export const normal: RuleSet = { block: block_normal, inline: inline_normal };
export const pedantic: RuleSet = { block: block_normal, inline: inline_pedantic };

export const gfm: RuleSet = { block: block_gfm, inline: inline_gfm };
export const gfm_tables: RuleSet = { block: block_gfm_tables, inline: inline_gfm };
export const gfm_breaks: RuleSet = { block: block_gfm, inline: inline_gfm_breaks };
export const gfm_tables_breaks: RuleSet = { block: block_gfm_tables, inline: inline_gfm_breaks };
