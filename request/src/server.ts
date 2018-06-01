import { parse } from 'url';
import { request as node_request, IncomingHttpHeaders } from 'http';
import { Method, Headers, GenericBody, DataType, ResFn, ErrFn, AbrFn } from './types';

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

export function request(method: Method, url: string, headers: Headers, body: GenericBody | void, res_type: DataType | void, res_fn: ResFn, err_fn: ErrFn): AbrFn {
    const { protocol, hostname, port, path } = parse(url);
    const req = node_request({ method, protocol, hostname, port, path, headers }, (res) => {
        if (res_type != undefined) {
            const bufs: Buffer[] = [];
            res.on('data', (buf) => {
                bufs.push(buf as Buffer);
            });
            res.on('end', () => {
                const body = Buffer.concat(bufs);
                res_fn(res.statusCode as number,
                    res.statusMessage as string,
                    parseHeaders(res.headers),
                    res_type == DataType.String ?
                        body.toString('utf8') :
                        body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength));
            });
        } else {
            res_fn(res.statusCode as number,
                res.statusMessage as string,
                parseHeaders(res.headers),
                undefined);
        }
    });
    req.on('error', err_fn);
    if (body) {
        req.write(Buffer.from(body));
    }
    req.end();
    return () => {
        req.abort();
    };
}
