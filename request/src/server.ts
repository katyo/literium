import { parse } from 'url';
import { Readable } from 'stream';
import { request as node_request, IncomingHttpHeaders } from 'http';
import { Method, Headers, GenericBody, DataType, ResFn, ErrFn, AbrFn, StaFn } from './types';

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

export function request(method: Method, url: string, headers: Headers, body: GenericBody | void, res_type: DataType | void, res_fn: ResFn, err_fn: ErrFn, sta_fn: StaFn): AbrFn {
    const { protocol, hostname, port, path } = parse(url);
    const data = body ? Buffer.from(body) : undefined;
    if (data) {
        headers['content-length'] = `${data.length}`;
    }
    const req = node_request({ method, protocol, hostname, port, path, headers }, res => {
        if (res_type == undefined) {
            res_fn(res.statusCode as number,
                res.statusMessage as string,
                parseHeaders(res.headers),
                undefined);
        } else {
            const content_length = res.headers['content-length'];
            const size = content_length ? parseInt(content_length, 10) : -1;
            let left = 0;
            const bufs: Buffer[] = [];
            sta_fn(left, size, true);
            res.on('data', (buf) => {
                left += buf.length;
                sta_fn(left, size, true);
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
            res.on('error', error => {
                err_fn(error);
            });
        }
    });
    req.on('error', error => {
        err_fn(error);
    });
    if (data) {
        let left = 0;
        new Readable({
            read(size: number) {
                for (; ;) {
                    sta_fn(left, data.length, false);
                    const read = Math.min(size, data.length - left);
                    const chunk = read ? data.slice(left, left + read) : null;
                    left += read;
                    if (!this.push(chunk) || !read) break;
                }
            }
        }).pipe(req);
    } else {
        req.end();
    }
    return () => {
        req.abort();
    };
}
