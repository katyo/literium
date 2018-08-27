import {
    Keyed, keyed,
    do_seq,
    some, some_def, map_some, then_none, then_some
} from '@literium/base';
import { RouterApi } from './location';

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

export function langPrefix<Lang extends string, Args>({ match, build }: RouterApi<Args>, locales: Locale<Lang>[], defLang: Lang): RouterApi<Keyed<Lang, Args>> {
    const re = new RegExp('^\\/(' + locales.map(({ lang }) => lang).join('|') + ')(.*)$');
    return {
        match: path => do_seq(
            re.exec(path),
            some_def,
            then_none(() => some(['', defLang, path])),
            then_some(([_, lang, path]) => do_seq(
                match(path),
                map_some(args => keyed(lang as Lang, args))
            ))
        ),
        build: ({ $: lang, _: args }) => do_seq(
            build(args),
            map_some(path => `/${lang || defLang}${path}`)
        )
    };
}
