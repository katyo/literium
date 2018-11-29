import { Emit, Result, OkFn, ok, err, do_seq, then_future_ok } from '@literium/base';
import { Readable } from 'stream';
import { request } from 'http';
import { Handler, Request, Response } from './http';
import { StreamBody } from './body';
import { BindOptions } from './bind';

export function proxy_handler(bind: BindOptions): Handler {
    return (req: Request) => do_seq(
        req.body(StreamBody),
        then_future_ok(body => (emit: Emit<Result<Response, string>>) => {
            const proxy_req = request({
                ...bind,
                method: req.method,
                headers: req.headers().reduce((all, name) => {
                    const value = req.header(name);
                    if (value.length > 0) {
                        all[name] = value.length == 1 ? value[0] : value;
                    }
                    return all;
                }, {} as Record<string, string | string[]>),
                path: req.url,
            }, proxy_res => {
                if (proxy_res.statusCode) {
                    const headers: Record<string, string[]> = {};
                    for (const header in proxy_res.headers) {
                        const value = proxy_res.headers[header];
                        headers[header] = typeof value == 'string' ? [value] : value != null ? value : [];
                    }
                    emit(ok({
                        status: proxy_res.statusCode,
                        message: proxy_res.statusMessage || '',
                        headers: headers,
                        body: () => (ok as OkFn<string>)(proxy_res as Readable)
                    }));
                } else {
                    emit(err("Proxy status invalid"));
                }
            });
            let aborted = false;
            proxy_req.on('error', ({message}) => {
                if (!aborted) emit(err(`Proxy request error: ${message}`));
            });
            body.pipe(proxy_req, { end: true });
            return () => {
                aborted = true;
                proxy_req.abort();
            };
        })
    );
}
