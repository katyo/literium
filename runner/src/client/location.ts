import { Emit, Option, is_some, un_some, ok, err, tuple, keyed, un_some_or } from '@literium/base';
import { RouterApi, SetRoute, NavApi, NavInit } from '../location';

export function getBase({ location: { protocol, host } }: Window): string {
    return `${protocol}//${host}`;
}

export function initNav(win: Window = window): NavInit {
    const { location, history } = win;

    const pushState = history && history.pushState;

    function getLocal(url: string): string | void {
        const { protocol, host, path, hash } = parseUrl(url);

        return ((!protocol || protocol == location.protocol) &&
            (!host || host == location.host) &&
            (pushState || path == `${location.pathname}${location.search}`)) ?
            `${path}${hash || ''}` : undefined;
    }

    function getUrl(): string {
        return `${location.pathname}${location.search}${location.hash}`;
    }

    function setUrl(url: string) {
        location.href = url;
    }

    const goPath = pushState ? (path: string) => {
        // fast local navigation using html5 History API
        history.pushState(null, '', path);
    } : (path: string) => {
        // fallback for changing hash only
        location.href = path;
    };

    return <Args, Signal extends SetRoute<Args>>({ match, build }: RouterApi<Args>) => {
        let setRoute: (args: Option<Args>, path: string) => void;

        function setPath(path: string): boolean {
            const args = match(path);
            if (is_some(args)) {
                const new_path = un_some_or(path)(build(un_some(args)));
                if (new_path != path) {
                    path = new_path;
                    goPath(path);
                }
            }
            setRoute(args, path);
            return is_some(args);
        }

        function goUrl(url: string) {
            const path = getLocal(url);
            if (path != undefined) {
                if (setPath(path)) {
                    goPath(path);
                    return true;
                }
            }
            return false;
        }

        return <NavApi<Signal>>{
            create(emit: Emit<Signal>) {
                setRoute = (args, path) => {
                    emit(keyed('route' as 'route', is_some(args) ? ok(tuple(un_some(args), path)) : err(path)) as Signal);
                };

                // send initial url
                setPath(getUrl());

                if (pushState) {
                    // handle browser history navigation events
                    win.addEventListener("popstate", () => {
                        setPath(getUrl());
                    }, false);
                }
            },

            direct(url) {
                if (!goUrl(url)) {
                    setUrl(url);
                }
            },

            handle(evt) {
                const elm = evt.target as HTMLElement;
                if (evt.type == 'click' && elm.tagName == 'A') {
                    const url = elm.getAttribute('href');
                    const target = elm.getAttribute('target');
                    if (url && !target) {
                        if (goUrl(url)) {
                            evt.preventDefault();
                            evt.stopPropagation();
                        }
                    }
                }
            }
        }
    };
}

const urlRegExp = /^([^:]+:)?(\/\/)?(?:([^@:\/\?#]*)@)?(([^:\/\?#]+)(?:\:(\d+))?)?(([\/]?[^\?#]*)?(\?[^#]*)?)?(#.*)?$/;

function parseUrl(url: string) {
    const [href, protocol, slashes, auth, host, hostname, port, path, pathname, search, hash] =
        url.match(urlRegExp) as (string | undefined)[];
    return { href: href + (pathname ? '' : '/'), protocol, slashes: !!slashes, auth, host, hostname, port, path: path || '/', pathname: pathname || '/', search, hash };
}
