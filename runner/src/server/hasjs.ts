import { Request } from './request';

export function hasJs(req: Request): boolean {
    return /js=1/.test(req.header('cookie').join(''));
}
