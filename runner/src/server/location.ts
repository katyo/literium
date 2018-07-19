import { Emit, is_some, un_some, ok, err, keyed, tuple, dummy, un_some_or } from 'literium';
import { RouterApi, SetRoute, NavApi, NavInit } from '../location';
import { Request } from './request';

export function getBase(req: Request): string {
    const host = req.header('host').join('');
    return `http://${host}`;
}

export function initNav(req: Request, redir: (url: string) => void = dummy): NavInit {
    return <Args, Signal extends SetRoute<Args>>({ match, build }: RouterApi<Args>) => {
        return <NavApi<Signal>>{
            create(emit: Emit<Signal>) {
                let path = req.url;
                const args = match(path);
                if (is_some(args)) {
                    const new_path = un_some_or(path)(build(un_some(args)));
                    if (new_path != path) {
                        path = new_path;
                        redir(path);
                    }
                }
                emit(keyed('route' as 'route', is_some(args) ? ok(tuple(un_some(args), path)) : err(path)) as Signal);
            },
            direct: redir,
            handle: dummy,
        };
    };
}
