import { VNode, h } from 'literium';
import { asBool } from './widget';

export const enum IconKind {
    // Navigation

    ArrowUp = 'arrow-up',
    ArrowRight = 'arrow-right',
    ArrowDown = 'arrow-down',
    ArrowLeft = 'arrow-left',

    Upward = 'upward',
    Forward = 'forward',
    Downward = 'downward',
    Back = 'back',
    Backward = 'back',

    Caret = 'caret',
    Menu = 'menu',
    Apps = 'apps',

    MoreHoriz = 'more-horiz',
    MoreVert = 'more-vert',

    // Action

    ResizeHoriz = 'resize-horiz',
    ResizeVert = 'resize-vert',
    Plus = 'plus',
    Minus = 'minus',
    Cross = 'cross',
    Check = 'check',
    Stop = 'stop',
    Shutdown = 'shutdown',
    Refresh = 'refresh',
    Search = 'search',
    Flag = 'flag',
    Bookmark = 'bookmark',
    Edit = 'edit',
    Delete = 'delete',
    Share = 'share',
    Download = 'download',
    Upload = 'upload',

    // Object

    Mail = 'mail',
    People = 'people',
    Message = 'message',
    Photo = 'photo',
    Time = 'time',
    Location = 'location',
    Link = 'link',
    Emoji = 'emoji',
}

export const enum IconSize {
    X2 = 2,
    X3 = 3,
    X4 = 4,
    Double = 2,
    Triple = 3,
    Quadruple = 4,
}

export interface IconProps {
    kind: IconKind;
    size?: IconSize;
}

export function icon({ kind, size }: IconProps): VNode {
    return h('i', { class: { icon: true, [`icon-${kind}`]: true, [`icon-${size}x`]: asBool(size) } });
}
