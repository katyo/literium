import { IncomingMessage } from 'http';

export function hasJs(req: IncomingMessage): boolean {
    const { cookie } = req.headers;
    if (cookie) {
        for (const c of typeof cookie == 'string' ? [cookie] : cookie) {
            if (/js=1/.test(c)) {
                return true;
            }
        }
    }
    return false;
}
