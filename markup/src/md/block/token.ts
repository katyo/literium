export const enum BlockTag {
    Chunks,
    Heading,
    Paragraph,
    Quote,
    List,
    OrdList,
    Table,
    Code,
    Space, /* newline */
    Hr,
    Text,
    Html,
}

export const enum Align {
    None,
    Left,
    Center,
    Right,
}

export type BlockInlines<Type> = Type;
export type BlockChildren<Type> = BlockToken<Type>[];

export interface BlockHeading<Type> {
    $: BlockTag.Heading,
    n: number;
    a: string;
    _: BlockInlines<Type>;
}

export interface BlockParagraph<Type> {
    $: BlockTag.Paragraph,
    p?: true; // preformatted
    _: BlockInlines<Type>;
}

export interface BlockQuote<Type> {
    $: BlockTag.Quote,
    _: BlockChildren<Type>;
}

export interface BlockList<Type> {
    $: BlockTag.List;
    b: Bullet;
    _: BlockItem<Type>[];
}

export interface BlockOrdList<Type> {
    $: BlockTag.OrdList;
    m: Marker;
    _: BlockItem<Type>[];
}

export interface BlockItem<Type> {
    l: boolean; // loose
    _: BlockChildren<Type>;
}

export const enum Marker {
    Numer, // 1.
    alpha, // a.
    Alpha, // A.
    roman, // iii.
    Roman, // III.
}

export const enum Bullet {
    Circle, // o
    Disc,   // *
    Square, // -
}

export interface BlockTable<Type> {
    $: BlockTag.Table;
    h: BlockInlines<Type>[];
    a: Align[];
    _: BlockInlines<Type>[][];
}

export interface BlockSpace {
    $: BlockTag.Space | BlockTag.Hr;
}

export interface BlockCode {
    $: BlockTag.Code;
    l?: string;
    f?: true;
    _: string;
}

export interface BlockText<Type> {
    $: BlockTag.Text;
    _: BlockInlines<Type>;
}

export interface BlockHtml {
    $: BlockTag.Html;
    p?: true;
    _: string;
}

export interface BlockChunks<Type> {
    $: BlockTag.Chunks;
    _: Type[];
}

export type PureBlockToken<Type> = BlockHeading<Type> | BlockParagraph<Type> | BlockQuote<Type> | BlockList<Type> | BlockOrdList<Type> | BlockTable<Type> | BlockCode | BlockSpace | BlockHtml;

export type BlockToken<Type> = PureBlockToken<Type> | BlockText<Type> | BlockChunks<Type>;
