import { Request } from './request';

export function getLangs(req: Request): ReadonlyArray<string> {
    return req.header('accept-language').join(',').split(/\s*,\s*/);
}
