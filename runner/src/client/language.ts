export function getLangs({ navigator }: Window): ReadonlyArray<string> {
    const lang = navigator.language ||
        (navigator as any).browserLanguage ||
        (navigator as any).userLanguage ||
        (navigator as any).systemLanguage;
    return navigator.languages || lang && [lang];
}
