import { parse } from 'url';
import { request as node_request, IncomingHttpHeaders } from 'http';
import { Method, Headers, ResFn, ErrFn, AbrFn } from '../request';

function parseHeaders(h: IncomingHttpHeaders | undefined): Headers {
    const hs: Headers = {};
    if (h) {
        for (let f in h) {
            const d = h[f];
            if (d) {
                const k = f.replace(/(:?^|\-)\w/g, c => c.toUpperCase());
                const v = typeof d == 'string' ? d : d.join('; ');
                hs[k] = v;
            }
        }
    }
    return hs;
}

export function request(method: Method, url: string, headers: Headers, body: Buffer | undefined, need_body: boolean, res_fn: ResFn, err_fn: ErrFn): AbrFn {
    const { protocol, hostname, port, path } = parse(url);
    const req = node_request({ method, protocol, hostname, port, path, headers }, (res) => {
        if (need_body) {
            const bufs: Buffer[] = [];
            res.on('data', (buf) => {
                bufs.push(buf as Buffer);
            });
            res.on('end', () => {
                res_fn(res.statusCode as number,
                       res.statusMessage as string,
                       parseHeaders(res.headers),
                       Buffer.concat(bufs));
            });
        } else {
            res_fn(res.statusCode as number,
                   res.statusMessage as string,
                   parseHeaders(res.headers));
        }
    });
    req.on('error', err_fn);
    if (body) {
        req.write(body);
    }
    req.end();
    return () => {
        req.abort();
    };
}
