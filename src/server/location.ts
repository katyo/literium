import { Nav, SetPath } from '../location';
import { IncomingMessage, ServerResponse } from 'http';

export function getBase({ headers: { host } }: IncomingMessage): string {
    return `http//${host}`;
}

export function initNav<Event extends SetPath>(req: IncomingMessage, res: ServerResponse): Nav<Event> {
    return {
        on: (fork) => {
            const [send, done] = fork();
            send({ $: 'path', path: req.url || '' } as Event);
            done();
        },
        go: (url: string) => {
            res.writeHead(302, 'Permanent Redirect', { 'location': url });
            res.end();
        },
        ev: (e) => { },
        is: (fn) => { },
    };
}
