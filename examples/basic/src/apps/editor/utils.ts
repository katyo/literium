export function cancelEvent(event: Event) {
    if (event.stopPropagation) event.stopPropagation();
    else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault();
    else event.returnValue = false;
}

const { fromCharCode } = String;

export function hasSpecialKey(event: KeyboardEvent): boolean {
    return event.altKey || event.ctrlKey || event.metaKey;
}

export function getCharacter(event: KeyboardEvent): string | void {
    /*
    const code = event.which == null ? event.keyCode : // IE
        event.which != 0 && event.charCode != 0 ? event.which : // !IE
            0;
    */
    const code = event.charCode != null ? event.charCode : event.keyCode;

    if (code) {
        if (code < 32) return; // special character
        return fromCharCode(code); // ordinary character
    }

    // other special characters
}
