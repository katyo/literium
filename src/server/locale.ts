import { IncomingMessage } from 'http';

export function getLangs(req: IncomingMessage): string[] {
    let header = req.headers['accept-language'] || '';
    if (typeof header != 'string') {
        header = header.join(',');
    }
    return header.split(/\s*,\s*/);
}
