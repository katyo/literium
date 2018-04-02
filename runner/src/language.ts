export interface Locale {
    lang: string;
    title: string;
}

export function getLang(locales: Locale[], langs: string[]): string {
    for (const lang of langs) {
        for (const { lang: code } of locales) {
            if (lang.slice(0, code.length) == code) {
                return code;
            }
        }
    }
    return locales.length ? locales[0].lang : '';
}

export interface HasLocales {
    locales: Locale[];
}

export interface HasLang {
    lang: string;
}

export interface SetLang {
    $: 'lang';
    lang: string;
}

export function setLang<State extends HasLang>(state: State, { lang }: SetLang): State {
    return { ...(state as {}), lang } as State;
}
