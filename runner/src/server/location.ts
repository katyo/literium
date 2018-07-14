import { is_some, un_some, dummy, un_some_or, Spawn } from 'literium';
import { RouterApi, SetRoute, NavInit } from '../location';
import { IncomingMessage } from 'http';

export function getBase({ headers: { host } }: IncomingMessage): string {
    return `http://${host}`;
}

export function initNav(req: IncomingMessage, redir?: (url: string) => void): NavInit {
    return <Args>(spawn: Spawn, change: SetRoute<Args>, { match, build }: RouterApi<Args>) => {
        let path = req.url || '';
        const route = match(path);
        if (is_some(route)) {
            const new_path = un_some_or(path)(build(un_some(route)));
            if (new_path != path) {
                path = new_path;
                redir!(path);
            }
        }
        return {
            route,
            path,
            direct: redir || dummy,
            handle: dummy,
        };
    };
}
