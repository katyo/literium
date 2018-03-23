/**
 * Helpers
 */

export function escape(html: string, encode?: true) {
    return html
        .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function unescape(html: string): string {
    return html.replace(/&([#\w]+);/g, (_, n) => {
        n = n.toLowerCase();
        return n == 'colon' ? ':' :
            n.charAt(0) != '#' ? '' :
                String.fromCharCode(n.charAt(1) == 'x'
                    ? parseInt(n.substring(2), 16)
                    : +n.substring(1));
    });
}

export function saneLink(href: string) {
    try {
        var prot = decodeURIComponent(href)
            .replace(/[^\w:]/g, '')
            .toLowerCase();
    } catch (e) {
        return false;
    }
    if (prot.indexOf('javascript:') == 0 || prot.indexOf('vbscript:') == 0) {
        return false;
    }
    return true;
}

export function append<Type>(list: Type[], ent: Type | Type[]) {
    if (Array.isArray(ent)) {
        for (const val of ent) list.push(val);
    } else {
        list.push(ent);
    }
}

export function replace({ source: regex }: RegExp, opt: string,
    ...substs: [string | RegExp, string | RegExp][]): RegExp {
    for (const [name, val] of substs) {
        let sub: string = (val as RegExp).source || val as string;
        sub = sub.replace(/(^|[^\[])\^/g, '$1');
        regex = regex.replace(name as RegExp, sub);
    }
    return new RegExp(regex, opt);
}

export const noop = { exec: () => { } } as any as RegExp;

/**
 * Smartypants Transformations
 */
export function smartypants(text: string) {
    return text
        // em-dashes
        .replace(/--/g, '\u2014')
        // opening singles
        .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
        // closing singles & apostrophes
        .replace(/'/g, '\u2019')
        // opening doubles
        .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
        // closing doubles
        .replace(/"/g, '\u201d')
        // ellipses
        .replace(/\.{3}/g, '\u2026');
}

/**
 * Mangle Links
 */
export function mangle(text: string): string {
    let out = ''
        , l = text.length
        , i = 0
        , ch;

    for (; i < l; i++) {
        ch = text.charCodeAt(i);
        if (Math.random() > 0.5) {
            ch = 'x' + ch.toString(16);
        }
        out += '&#' + ch + ';';
    }

    return out;
}
