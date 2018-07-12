import { Option, some, none, some_def, then_some, tuple, mk_seq, do_seq, then_result, future_async, map_future_ok, map_future_err, err_to_str, future_ok } from 'literium-base';
import { extname, resolve, join } from 'path';
import { open, createReadStream } from 'fs';
import { ServerRequest } from 'http';
import { FutureResponse, not_found, okay, with_body, StreamBody } from './http';
import { Readable } from 'stream';

export type MimeMap = Record<string, string>;

export const mime_map: MimeMap = {
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.eot': 'application/vnd.ms-fontobject',
    '.pdf': 'application/pdf',
    '.map': 'application/octet-stream',
};

function resource_check(dir: string, mime_map: MimeMap): (req: ServerRequest) => Option<[string, string]> {
    const root = resolve(dir);
    return req => req.method == 'GET' && req.url ? do_seq(
        some_def(mime_map[extname(req.url)]),
        then_some(mime => {
            const path = join(root, req.url as string);
            return path.search(root) == 0 ? some(tuple(mime, path)) : none();
        })
    ) : none();
}

export function resource_handler(root: string, types: MimeMap = mime_map): (req: ServerRequest) => FutureResponse<Readable> {
    return mk_seq(
        resource_check(root, types),
        then_result(([mime, path]) => do_seq(
            future_async(open, path, 'r'),
            map_future_ok(fd => do_seq(
                okay(),
                with_body(StreamBody, createReadStream(path, { fd }), mime)
            )),
            map_future_err(err_to_str)
        ), () => future_ok(not_found()))
    );
}
