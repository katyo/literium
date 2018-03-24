export const enum InlineTag {
    Chunks,
    Link,
    Image,
    Anchor,
    //Text,
    Strong,
    Em,
    Code,
    Del,
    Br,
    Math,
}

export type Children<Type> = Type;

export interface InlineLink<Type> {
    $: InlineTag.Link;
    l: string;
    t?: string;
    _: Children<Type>;
}

export interface InlineImage {
    $: InlineTag.Image;
    l: string;
    t?: string;
    _: string;
}

export type InlinePhraseTag = InlineTag.Strong | InlineTag.Em | InlineTag.Code | InlineTag.Del;

export interface InlinePhrase<Type> {
    $: InlinePhraseTag,
    _: Children<Type>;
}

export interface InlineAnchor {
    $: InlineTag.Anchor,
    _: string;
}

export type InlineBreakTag = InlineTag.Br;

export interface InlineBreak {
    $: InlineBreakTag;
}

export interface InlineMath {
    $: InlineTag.Math;
    _: string;
}

export interface InlineChunks<Type> {
    $: InlineTag.Chunks;
    _: Type[];
}

export type TaggedInlineToken<Type> = InlineLink<Type> | InlineImage | InlinePhrase<Type> | InlineAnchor | InlineBreak | InlineMath;

export type InlineToken<Type> = string | InlineChunks<Type> | TaggedInlineToken<Type>;
