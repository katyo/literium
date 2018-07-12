import { is_some, un_some, ok, err, keyed, tuple, dummy, un_some_or } from 'literium';
import { RouterApi, SetRoute, NavApi, NavInit } from '../location';
import { IncomingMessage } from 'http';

export function getBase({ headers: { host } }: IncomingMessage): string {
    return `http://${host}`;
}

export function initNav(req: IncomingMessage, redir?: (url: string) => void): NavInit {
    return <Args, Signal extends SetRoute<Args>>({ match, build }: RouterApi<Args>) => {
        return <NavApi<Signal>>{
            create: fork => {
                const [emit, done] = fork();
                let path = req.url || '';
                const args = match(path);
                if (is_some(args)) {
                    const new_path = un_some_or(path)(build(un_some(args)));
                    if (new_path != path) {
                        path = new_path;
                        redir!(path);
                    }
                }
                emit(keyed('route' as 'route', is_some(args) ? ok(tuple(un_some(args), path)) : err(path)) as Signal);
                done();
            },
            direct: redir || dummy,
            handle: dummy,
        };
    };
}
