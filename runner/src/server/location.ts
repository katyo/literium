import { is_some, un_some, ok, err, keyed, tuple, dummy } from 'literium';
import { RouterApi, SetRoute, NavApi, NavInit } from '../location';
import { IncomingMessage, ServerResponse } from 'http';

export function getBase({ headers: { host } }: IncomingMessage): string {
    return `http://${host}`;
}

export function initNav(req: IncomingMessage, res: ServerResponse): NavInit {
    return <Args, Signal extends SetRoute<Args>>({ match, build }: RouterApi<Args>) => {
        return <NavApi<Signal>>{
            create: fork => {
                const [emit, done] = fork();
                const path = req.url || '';
                const args = match(path);
                emit(keyed('route' as 'route', is_some(args) ? ok(tuple(un_some(args), path)) : err(path)) as Signal);
                done();
            },
            direct: url => {
                res.writeHead(302, 'Permanent Redirect', { 'location': url });
                res.end();
            },
            handle: dummy,
        };
    };
}
