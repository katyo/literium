import { Nav, SetPath } from './location';

const urlRegExp = /^([^:]+:)?(\/\/)?(?:([^@:\/\?#]*)@)?(([^:\/\?#]+)(?:\:(\d+))?)?(([\/]?[^\?#]*)?(\?[^#]*)?)?(#.*)?$/;

function parse(url: string) {
    const [href, protocol, slashes, auth, host, hostname, port, path, pathname, search, hash] =
        url.match(urlRegExp) as (string | undefined)[];
    return { href: href + (pathname ? '' : '/'), protocol, slashes: !!slashes, auth, host, hostname, port, path: path || '/', pathname: pathname || '/', search, hash };
}

export function getBase({ location: { protocol, host } }: Window): string {
    return `${protocol}//${host}`;
}

export function initNav<Event extends SetPath>(win: Window = window): Nav<Event> {
    const { location, history } = win;

    const push_state = history && history.pushState;

    const get_local = (url: string): string | void => {
        const { protocol, host, path, hash } = parse(url);

        if ((!protocol || protocol == location.protocol) &&
            (!host || host == location.host) &&
            (push_state || path == `${location.pathname}${location.search}`)) {
            return `${path}${hash || ''}`;
        }
    };

    const get_url = (): string => {
        return `${location.pathname}${location.search}${location.hash}`;
    };

    const set_url = (url: string) => {
        location.href = url;
    };

    let set_path: (path: string) => void;

    const go_path = push_state ? (path: string) => {
        // fast local navigation using html5 History API
        history.pushState(null, '', path);
    } : (path: string) => {
        // fallback for changing hash only
        location.href = path;
    };

    // local path checker
    let check_path: (path: string) => boolean;

    return {
        on: (fork) => {
            const [send,] = fork();

            set_path = (path: string) => {
                send({ $: 'path', path } as Event);
            };

            // send initial url
            set_path(get_url());

            if (push_state) {
                // handle browser history navigation events
                win.addEventListener("popstate", () => {
                    set_path(get_url());
                }, false);
            }
        },
        go: (url: string) => {
            const path = get_local(url);
            if (path && (!check_path || check_path(path))) {
                go_path(path);
                set_path(path);
            } else {
                set_url(url);
            }
        },
        ev: e => {
            const elm = e.target as HTMLElement;
            if (elm.tagName == 'A') {
                const url = elm.getAttribute('href');
                const target = elm.getAttribute('target');
                if (url && !target) {
                    const path = get_local(url);
                    if (path && (!check_path || check_path(path))) {
                        e.preventDefault();
                        e.stopPropagation();

                        go_path(path);
                        set_path(path);
                    }
                }
            };
        },
        is: (fn) => {
            check_path = fn;
        },
    };
}
