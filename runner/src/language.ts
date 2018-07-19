export interface Locale<Lang extends string> {
    lang: Lang;
    title: string;
}

export type LocaleLang<L> = L extends Locale<infer Lang> ? Lang : L extends Locale<infer Lang>[] ? Lang : never;

export function mkLocale<Lang extends string>(lang: Lang, title: string): Locale<Lang> {
    return { lang, title };
}

export function getLang<Lang extends string>(locales: Locale<Lang>[], langs: ReadonlyArray<string>): Lang {
    for (const lang of langs) {
        for (const { lang: code } of locales) {
            if (lang.slice(0, code.length) == code) {
                return code;
            }
        }
    }
    if (locales.length) return locales[0].lang;
    throw 'Missing locales';
}

export interface HasLocales<Lang extends string> {
    locales: Locale<Lang>[];
}

export interface HasLang<Lang extends string> {
    lang: Lang;
}

export interface SetLang {
    $: 'lang';
    lang: string;
}

export function setLang<Lang extends string, State extends HasLang<Lang>>(state: State, { lang }: SetLang): State {
    return { ...(state as {}), lang } as State;
}
