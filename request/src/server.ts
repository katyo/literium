import { parse } from 'url';
import { request as node_request } from 'http';
import { Option, Result, Emit, Done, do_seq, ok, err, map_future_ok, then_future_ok, none, some, some_def, constant, keyed } from '@literium/base';
import { Method, ApiTag, Plugin, Request, ErrorKind, Error, Progress, BodyTypeMap, BodyType, PluginResult, plugin_fail, plugin_done } from './types';

export function request<A extends object, R extends object>(plugin: Plugin<A, R>): Request<A, R> {
    return arg => {
        let res = {} as R;

        let method = Method.Get;
        let origin = '';
        let path = '';
        let query = '';
        let headers = {} as Record<string, string | string[]>;

        let req_body: Buffer | void;
        let req_progress: Emit<Progress>; 
        
        function send_body<T extends BodyTypeMap[BodyType]>(body: T) {
            if (req_body == null) {
                req_body = Buffer.from(body);
                headers['content-length'] = '' + req_body.length;
            }
        }

        let resp_status: number;
        let resp_message: string;
        let resp_headers: Record<string, string | string[]>;

        let resp_type: Option<BodyType> = none();
        let resp_body: Buffer | void;
        let resp_error = false;
        let resp_trig: Emit<Result<void, Error>> | void;
        let resp_cancel: Done | void;
        let resp_progress: Emit<Progress>;
        
        return do_seq(
            // prepare request
            plugin({
                $: ApiTag.Request,
                m(new_method) { method = new_method; },
                o(new_origin) { origin = new_origin.replace(/\/+$/, ''); },
                p(ext_path) {
                    ext_path = ext_path.replace(/^\/+/, '');
                    if (ext_path) {
                        if (!path || path.charAt(path.length - 1) != '/') path += '/';
                        path += ext_path;
                    }
                },
                q(ext_query) {
                    query += (query ? '&' : '?') + ext_query.replace(/^&+/, '').replace(/&+$/, '');
                },
            }, arg, res),
            then_future_ok(() => {
                // set request headers
                return plugin({
                    $: ApiTag.RequestHeaders,
                    h(name, value) {
                        if (name in headers) {
                            if (!Array.isArray(headers[name])) {
                                headers[name] = [headers[name] as string];
                            }
                            (headers[name] as string[]).push(value);
                        } else {
                            headers[name] = value;
                        }
                    },
                }, arg, res)
            }),
            // setup response
            then_future_ok(() => plugin({
                $: ApiTag.ResponseBody,
                b(ty: BodyType) { resp_type = some(ty); },
                p: on => { resp_progress = on; },
            }, arg, res)),
            // set request body
            then_future_ok(() => plugin({
                $: ApiTag.RequestBody,
                s: send_body,
                b: send_body,
                p: on => { req_progress = on; },
            }, arg, res)),
            // start request
            then_future_ok(() => {
                return (emit: Emit<Result<void, Error>>) => {
                    const { protocol, hostname, port, path: fullpath } = parse(origin + path + query);
                    
                    const req = node_request({ method, protocol, hostname, port, path: fullpath, headers }, resp => {
                        resp_status = resp.statusCode || 0;
                        resp_message = resp.statusMessage || '';
                        resp_headers = resp.headers as Record<string, string | string[]>;
                        
                        if (resp_type.$) {
                            const bufs: Buffer[] = [];
                            
                            resp.on('data', buf => {
                                bufs.push(buf as Buffer);
                            });
                            resp.on('end', () => {
                                resp.removeAllListeners();
                                if (bufs.length) {
                                    resp_body = Buffer.concat(bufs);
                                    if (resp_progress) resp_progress({
                                        loaded: resp_body.length,
                                        total: some(resp_body.length),
                                    });
                                }
                                if (resp_trig) resp_trig(ok());
                            });
                            resp.on('error', () => {
                                resp.removeAllListeners();
                                resp_error = true;
                                if (resp_trig) resp_trig(err(keyed(ErrorKind.Download)));
                            });

                            resp_cancel = () => {
                                resp.removeAllListeners();
                                resp.destroy();
                            };
                        } else {
                            resp.destroy();
                        }
                        
                        emit(ok());
                    });

                    let req_sended = false;

                    req.on('error', () => {
                        req.removeAllListeners();
                        emit(err(req_sended ? keyed(ErrorKind.Upload) : keyed(ErrorKind.Request)));
                    });
                    
                    if (req_body != null) {
                        const len = req_body.length;
                        req.end(req_body, req_progress && (() => {
                            req_sended = true;
                            req_progress({
                                loaded: len,
                                total: some(len),
                            });
                        }));
                    } else {
                        req.end();
                    }
                    
                    return () => {
                        req.abort();
                    };
                }
            }),
            // handle response status
            then_future_ok(() =>  plugin({
                $: ApiTag.Response,
                s: resp_status,
                m: resp_message,
            }, arg, res)),
            // handle response headers
            then_future_ok(() => plugin({
                $: ApiTag.ResponseHeaders,
                h: name => {
                    let value = resp_headers[name];
                    if (Array.isArray(value)) {
                        if (!value.length) {
                            return none();
                        }
                        value = value.join(',');
                    }
                    return some_def(value);
                },
            }, arg, res)),
            // await response body
            then_future_ok(
                () => resp_error ? plugin_fail(err(keyed(ErrorKind.Download))) as PluginResult :
                    !resp_type.$ || resp_body ? plugin_done :
                    (emit: Emit<Result<void, Error>>) => (resp_trig = emit, resp_cancel as Done)),
            // handle response body
            then_future_ok(
                () => resp_type.$ && resp_body ? plugin(resp_type._ == BodyType.Binary ? {
                        $: ApiTag.ResponseBinaryBody,
                        b: resp_body.buffer.slice(resp_body.byteOffset, resp_body.byteOffset + resp_body.byteLength),
                    } : {
                        $: ApiTag.ResponseStringBody,
                        s: resp_body.toString(),
                    }, arg, res) : plugin_done),
            // return resulting data
            map_future_ok(constant(res))
        );
    };
}
