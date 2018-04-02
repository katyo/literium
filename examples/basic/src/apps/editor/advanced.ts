import { KeyCode, VNode, Send, h, either_a, either_b, keyed } from 'literium';
import { initHighlight, vdomRender } from 'literium-highlight';
import { State, Event, Selection, Region } from './common';
import { cancelEvent, hasSpecialKey, getCharacter } from './utils';

const renderHightlight = initHighlight(vdomRender);

export function render(state: State, send: Send<Event>): VNode {
    return h('pre.markup-editor', {
        style: { height: '250px' },
        attrs: { contenteditable: true },
        hook: {
            insert: (vnode) => { setSelection(vnode.elm as HTMLElement, state.selection); },
            update: (_, vnode) => { setSelection(vnode.elm as HTMLElement, state.selection); },
        },
        on: {
            click: (event: MouseEvent, vnode: VNode) => {
                sendSelection(state, vnode.elm as HTMLElement, send);
            },
            scroll: (event: MouseEvent, vnode: VNode) => {
                sendSelection(state, vnode.elm as HTMLElement, send);
            },
            keypress: (event: KeyboardEvent) => {
                const char = getCharacter(event);
                if (!hasSpecialKey(event) && char) {
                    cancelEvent(event);
                    sendInput(state, char, send);
                }
            },
            keyup: (event: KeyboardEvent, vnode: VNode) => {
                switch (event.keyCode) {
                    case KeyCode.LeftArrow:
                    case KeyCode.UpArrow:
                    case KeyCode.RightArrow:
                    case KeyCode.DownArrow:
                        sendSelection(state, vnode.elm as HTMLElement, send);
                        break;
                }
            },
            keydown: (event: KeyboardEvent, vnode: VNode) => {
                switch (event.keyCode) {
                    case KeyCode.Enter:
                    case KeyCode.Backspace:
                    case KeyCode.Delete:
                        cancelEvent(event);
                        sendInput(state, event.keyCode, send);
                        break;
                }
            }
        }
    }, renderHightlight(state.content, 'md'));
}

function sendInput(state: State, char: string | number, send: Send<Event>) {
    let { content, selection: sel } = state;

    let cursor: number;

    if (sel.$) {
        const start: number = Math.min(...sel._);
        const end: number = Math.max(...sel._);

        // cut selected
        content = content.substr(0, start) + content.substr(end);
        cursor = start;
    } else {
        cursor = sel._ as number;
    }

    const insert = (text: string) => {
        content = content.substr(0, cursor) + text + content.substr(cursor);
        cursor++;
    };

    const remove = (n: number) => {
        const a = n < 0 ? cursor + n : cursor;
        const b = n < 0 ? cursor : cursor + n;
        if (!sel.$) {
            content = content.substr(0, a) + content.substr(b);
            cursor = a;
        }
    };

    if (typeof char == 'number') {
        switch (char) {
            case KeyCode.Enter:
                insert('\n');
                break;
            case KeyCode.Backspace:
                remove(-1);
                break;
            case KeyCode.Delete:
                remove(+1);
                break;
        }
    } else {
        insert(char);
    }

    send(keyed('change' as 'change', content));
    send(keyed('select' as 'select', either_a(cursor) as Selection));
}

function sendSelection(state: State, node: HTMLElement, send: Send<Event>) {
    send(keyed('select' as 'select', getSelection(node)));
}

function setSelection(root: HTMLElement, sel: Selection): void {
    /*const oldSel = getSelection(root);

    if (equalSelection(oldSel, sel)) {
        return;
    }*/

    const doc = root.ownerDocument;
    const csel = doc.getSelection();

    let range = csel.rangeCount && csel.getRangeAt(0);

    if (!range) {
        range = doc.createRange();
        csel.addRange(range);
    }

    if (sel.$) {
        const start: [Node, number] = pickPosition(root, Math.min(...sel._));
        const end: [Node, number] = pickPosition(root, Math.max(...sel._));
        setRange(range, start, end);
        console.log('setSel', start, end);
    } else {
        const point: [Node, number] = pickPosition(root, sel._);
        setRange(range, point, point)
        console.log('setCur', point);
    }
}

function setRange(range: Range, start: [Node, number], end: [Node, number]) {
    if (range.startContainer !== start[0] || range.startOffset !== start[1]) {
        range.setStart(start[0], start[1]);
    }

    if (range.endContainer !== end[0] || range.endOffset !== end[1]) {
        range.setEnd(end[0], end[1]);
    }
}

function getSelection(node: HTMLElement): Selection {
    const sel = node.ownerDocument.getSelection();
    const start = findPosition(node, sel.anchorNode, sel.anchorOffset);
    return sel.isCollapsed ? either_a(start) :
        either_b([start, findPosition(node, sel.focusNode, sel.focusOffset)] as Region);
}

export const enum NodeType {
    ELEMENT_NODE = 1,
    ATTRIBUTE_NODE = 2,
    TEXT_NODE = 3,
}

function findPosition(root: Node, node: Node, offset: number): number {
    let pos = 0;

    function recurse(cur: Node): boolean {
        switch (cur.nodeType) {
            case NodeType.TEXT_NODE:
                if (cur == node) {
                    pos += offset;
                    return true;
                } else {
                    pos += (cur as Text).length;
                    return false;
                }
            case NodeType.ELEMENT_NODE:
                if (cur.childNodes.length) {
                    const count = cur == node ? offset : cur.childNodes.length;
                    for (let i = 0; i < count; i++) {
                        if (recurse(cur.childNodes[i])) {
                            return true;
                        }
                    }
                }

                if (cur == node) {
                    return true;
                }
        }
        return false;
    }

    recurse(root);

    return pos;
}

function pickPosition(root: Node, pos: number): [Node, number] {
    let node: Node = root;
    let offset: number = 0;

    function recurse(cur: Node): boolean {
        switch (cur.nodeType) {
            case NodeType.TEXT_NODE:
                if (pos <= (cur as Text).length) {
                    node = cur;
                    offset = pos;
                    pos = 0;
                    return true;
                } else {
                    pos -= (cur as Text).length;
                    return false;
                }
            case NodeType.ELEMENT_NODE:
                if (cur.childNodes.length) {
                    const count = cur.childNodes.length;
                    for (let i = 0; i < count; i++) {
                        if (recurse(cur.childNodes[i])) {
                            return true;
                        }
                    }
                }
        }
        return false;
    }

    recurse(root);

    return [node, offset];
}
