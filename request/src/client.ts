import { Result, Emit, do_seq, ok, err, future_err, map_future_ok, then_future_ok, Option, some, none, some_def, constant, keyed } from '@literium/base';
import { Method, ApiTag, Plugin, Request, ErrorKind, Error, BodyType, BodyTypeMap, PluginResult, plugin_done } from './types';

const enum ReadyState {
    UNSENT = 0,
    OPENED = 1,
    HEADERS_RECEIVED = 2,
    LOADING = 3,
    DONE = 4,
}

interface MozXMLHttpRequest extends XMLHttpRequest {
    sendAsBinary(data: any): void;
}

const to_binary: (data: BodyTypeMap[BodyType]) => BodyTypeMap[BodyType.Binary] =
    typeof Uint8Array == 'function' ? data => {
        if (typeof data == 'string') {
            var buf = new ArrayBuffer(data.length);
            var bufView = new Uint8Array(buf);
            for (var i = 0; i < data.length; i++) {
                bufView[i] = data.charCodeAt(i);
            }
            return buf;
        }
        return data;
    } : data => {
        if (typeof data == 'string') {
            var buf: number[] = new Array(data.length);
            for (var i = 0; i < data.length; i++) {
                buf[i] = data.charCodeAt(i);
            }
            return buf as any as BodyTypeMap[BodyType.Binary];
        }
        return data;
    };

let __xhr: XMLHttpRequest | void = new XMLHttpRequest();
__xhr.open(Method.Get, "", true);

const send_binary: (xhr: XMLHttpRequest, body: BodyTypeMap[BodyType.Binary]) => void =
    typeof (__xhr as MozXMLHttpRequest).sendAsBinary == 'function' ? (xhr, body) => {
        try {
            xhr.setRequestHeader('content-length', '' + body.byteLength);
        } catch (e) {}
        // upload binary string using Mozilla-specific sendAsBinary method
        (xhr as MozXMLHttpRequest).sendAsBinary(body);
    } : typeof Uint8Array == 'function' ? (xhr, body) => {
        // upload array buffer using XHR send method
        xhr.send(body);
    } : (xhr, body) => {
        // upload as binary DOMString (fallback)
        xhr.send(String.fromCharCode.apply(null, body));
    };

const [recv_binary, binary_body]: [(xhr: XMLHttpRequest) => void, (xhr: XMLHttpRequest) => BodyTypeMap[BodyType.Binary]] = (xhr => {
    if ('responseType' in xhr) {
        try {
            xhr.responseType = 'arraybuffer';
            // download array buffer using XHR responseType field
            return 'response' in xhr && xhr.responseType == 'arraybuffer';
        } catch (error) { }
    }
    return false;
})(__xhr) ? [xhr => {
    xhr.responseType = 'arraybuffer';
}, xhr => xhr.response] : typeof __xhr.overrideMimeType == 'function' ? [xhr => {
    // download binary string through overriding mime type
    xhr.overrideMimeType('text/plain; charset=x-user-defined');
}, xhr => {
    return to_binary(xhr.responseText);
}] : [_xhr => {
    // try download binary string as DOMString
}, xhr => {
    return to_binary(xhr.responseText);
}];

__xhr = undefined;

function cleanup(xhr: XMLHttpRequest) {
    if (xhr.upload) {
        delete xhr.upload.onerror;
        delete xhr.upload.onprogress;
    }
    delete xhr.onerror;
    delete xhr.onprogress;
    delete xhr.onreadystatechange;
}

export function request<A extends object, R extends object>(plugin: Plugin<A, R>): Request<A, R> {
    return arg => {
        let res = {} as R;
        
        const xhr = new XMLHttpRequest();

        let method = Method.Get;
        let origin = '';
        let path = '';
        let query = '';

        let already_sended = false;
        let send_error: Option<Error> = none();
        
        function safe_send<T>(unsafe_send: (arg: T) => void): (arg: T) => void {
            return arg => {
                if (!already_sended) {
                    already_sended = true;
                    try {
                        unsafe_send(arg);
                    } catch (e) {
                        send_error = some(keyed(ErrorKind.Request));
                    }
                }
            };
        }

        let resp_type: Option<BodyType> = none();
        
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
            then_future_ok(() => (
                // open request
                xhr.open(method, origin + path + query, true),
                // set request headers
                plugin({
                    $: ApiTag.RequestHeaders,
                    h(name, value) {
                        xhr.setRequestHeader(name, value);
                    },
                }, arg, res)
            )),
            // setup response
            then_future_ok(() => plugin({
                $: ApiTag.ResponseBody,
                b(ty: BodyType) {
                    resp_type = some(ty);
                    if (ty == BodyType.Binary) recv_binary(xhr);
                },
                p(progress) {
                    xhr.onprogress = e => {
                        progress({
                            loaded: e.loaded,
                            total: e.lengthComputable || e.total ? some(e.total) : none()
                        });
                    };
                },
            }, arg, res)),
            // send request body
            then_future_ok(() => plugin({
                $: ApiTag.RequestBody,
                s: safe_send<BodyTypeMap[BodyType.String]>(body => { xhr.send(body); }),
                b: safe_send<BodyTypeMap[BodyType.Binary]>(body => { send_binary(xhr, body); }),
                p(progress) {
                    if (xhr.upload) xhr.upload.onprogress = e => {
                        progress({
                            loaded: e.loaded,
                            total: some(e.total),
                        });
                    };
                },
            }, arg, res)),
            then_future_ok(() => (
                // send request without body
                safe_send(() => { xhr.send(); }),
                send_error.$ ? (
                    // handle send error
                    cleanup(xhr),
                    future_err(send_error._) as PluginResult
                ) : xhr.readyState >= ReadyState.HEADERS_RECEIVED ? (
                    // response already received
                    cleanup(xhr),
                    plugin_done
                ) : (emit: Emit<Result<void, Error>>) => {
                    // await response status and headers
                    if (xhr.upload) {
                        xhr.upload.onerror = () => {
                            cleanup(xhr);
                            emit(err(keyed(ErrorKind.Upload)));
                        };
                    }
                    xhr.onerror = () => {
                        cleanup(xhr);
                        emit(err(keyed(ErrorKind.Request)));
                    };
                    xhr.onreadystatechange = () => {
                        if (xhr.readyState >= ReadyState.HEADERS_RECEIVED) {
                            emit(ok());
                        }
                    };
                    return () => {
                        cleanup(xhr);
                        xhr.abort();
                    };
                }
            )),
            // handle response status
            then_future_ok(() => plugin({
                $: ApiTag.Response,
                s: xhr.status,
                m: xhr.statusText,
            }, arg, res)),
            // handle response headers
            then_future_ok(() => plugin({
                $: ApiTag.ResponseHeaders,
                h: name => some_def(xhr.getResponseHeader(name)),
            }, arg, res)),
            // await response body
            then_future_ok(() => !resp_type.$ || xhr.readyState >= ReadyState.DONE ? (
                // do not need response body or it is already received
                cleanup(xhr),
                plugin_done
            ) : (emit: Emit<Result<void, Error>>) => {
                // await response body or error
                xhr.onerror = () => {
                    cleanup(xhr);
                    emit(err(keyed(ErrorKind.Download)));
                };
                xhr.onreadystatechange = () => {
                    if (xhr.readyState >= ReadyState.DONE) {
                        cleanup(xhr);
                        emit(ok());
                    }
                };
                return () => {
                    cleanup(xhr);
                    xhr.abort();
                };
            }),
            // handle response body
            then_future_ok(
                () => resp_type.$ && (xhr.response || xhr.responseText) ?
                    plugin(resp_type._ == BodyType.Binary ? {
                        $: ApiTag.ResponseBinaryBody,
                        b: binary_body(xhr),
                    } : {
                        $: ApiTag.ResponseStringBody,
                        s: xhr.responseText,
                    }, arg, res) : plugin_done),
            // return resulting data
            map_future_ok(constant(res))
        );
    };
}
