import { Method, Headers, NativeBody, DataType, ResFn, ErrFn, AbrFn, StaFn } from './types';

export function request(method: Method, url: string, headers: Headers, body: NativeBody | void, res_type: DataType | void, res_fn: ResFn, err_fn: ErrFn, sta_fn: StaFn): AbrFn {
    let xhr = new XMLHttpRequest();

    xhr.open(method, url, true);
    for (let name in headers) {
        xhr.setRequestHeader(name, headers[name]);
    }

    xhr.onerror = () => {
        err_fn(new Error('Data recv error'));
    };

    xhr.onprogress = ({ loaded, total }) => {
        sta_fn(loaded, total || -1, true);
    };

    xhr.onreadystatechange = () => {
        xhr_on(xhr, res_fn, res_type, err_fn);
    };

    if (res_type != undefined) {
        download_init(xhr, res_type);
    }

    try {
        if (body) {
            const { upload } = xhr;
            if (upload) {
                upload.onerror = () => {
                    err_fn(new Error('Data send error'));
                };
                upload.onprogress = ({ loaded, total }) => {
                    sta_fn(loaded, total, false);
                };
            }

            upload_send(xhr, body);
        } else {
            xhr.send();
        }
    } catch (error) {
        delete xhr.onreadystatechange;
        err_fn(error);
        return () => { };
    }

    return () => {
        xhr.abort();
    }
}

function parseHeaders(hs: string) {
    const h: Headers = {};
    for (let he of hs.split(/\r?\n/)) {
        const [f, v] = he.split(/:\s*/);
        if (v && v.length) {
            h[f.replace(/(:?^|\-)\w/g, c => c.toUpperCase())] = v;
        }
    }
    return h;
}

function xhr_on(xhr: XMLHttpRequest, res_fn: ResFn, res_type: DataType | void, err_fn: ErrFn) {
    switch (xhr.readyState) {
        case 4: { // done
            delete xhr.onreadystatechange;
            if (xhr.status == 0) {
                err_fn(new Error('invalid status'));
            } else {
                res_fn(xhr.status, xhr.statusText, parseHeaders(xhr.getAllResponseHeaders()), res_type != undefined ? download_done(xhr, res_type) : undefined);
            }
        } break;
    }
};

type XHRAPI = [
    // upload send
    (xhr: XMLHttpRequest, body: NativeBody) => void,
    // download init
    (xhr: XMLHttpRequest, res_type: DataType | void) => void,
    // download done
    (xhr: XMLHttpRequest, res_type: DataType | void) => NativeBody
];

const [upload_send, download_init, download_done] = xhrapi();

interface MozXMLHttpRequest {
    sendAsBinary(data: any): void;
}

function xhrapi(): XHRAPI {
    const body_from: (data: NativeBody, res_type: DataType) => NativeBody =
        typeof Uint8Array == 'function' ? (data: NativeBody, res_type: DataType) => {
            if (typeof data == 'string' && res_type == DataType.Binary) {
                var buf = new ArrayBuffer(data.length);
                var bufView = new Uint8Array(buf);
                for (var i = 0; i < data.length; i++) {
                    bufView[i] = data.charCodeAt(i);
                }
                return buf;
            }
            return data;
        } : (data: NativeBody, res_type: DataType) => {
            if (typeof data == 'string' && res_type == DataType.Binary) {
                var buf: number[] = new Array(data.length);
                for (var i = 0; i < data.length; i++) {
                    buf[i] = data.charCodeAt(i);
                }
                return buf as any as ArrayBuffer;
            }
            return data;
        };

    const xhr = new XMLHttpRequest();
    xhr.open('get', '/', true);

    const upload_send = typeof (xhr as any as MozXMLHttpRequest).sendAsBinary == 'function' ? (xhr: XMLHttpRequest, body: NativeBody) => {
        // upload binary string using Mozilla-specific sendAsBinary method
        if (typeof body == 'string') {
            xhr.send(body);
        } else {
            (xhr as any as MozXMLHttpRequest).sendAsBinary(body);
        }
    } : typeof Uint8Array == 'function' ? (xhr: XMLHttpRequest, body: NativeBody) => {
        // upload array buffer using XHR send method
        xhr.send(body);
    } : (xhr: XMLHttpRequest, body: NativeBody) => {
        // upload as binary DOMString (fallback)
        xhr.send(typeof body == 'string' ? body : String.fromCharCode.apply(null, body));
    };

    const [download_init, download_done] = (xhr => {
        if ('responseType' in xhr) {
            try {
                xhr.responseType = 'arraybuffer';
                // download array buffer using XHR responseType field
                return 'response' in xhr && xhr.responseType == 'arraybuffer';
            } catch (error) { }
        }
        return false;
    })(xhr) ? [(xhr: XMLHttpRequest, res_type: DataType) => {
        if (res_type == DataType.Binary) {
            xhr.responseType = 'arraybuffer';
        }
    }, (xhr: XMLHttpRequest, res_type: DataType) => {
        return xhr.response;
    }] : typeof xhr.overrideMimeType == 'function' ? [(xhr: XMLHttpRequest, res_type: DataType) => {
        if (res_type == DataType.Binary) {
            // download binary string through overriding mime type
            xhr.overrideMimeType('text/plain; charset=x-user-defined');
        }
    }, (xhr: XMLHttpRequest, res_type: DataType) => {
        return body_from(xhr.responseText, res_type);
    }] : [(xhr: XMLHttpRequest) => {
        // download binary string as DOMString
    }, (xhr: XMLHttpRequest, res_type: DataType) => {
        return body_from(xhr.responseText, res_type);
    }];

    return [
        upload_send,
        download_init,
        download_done,
    ];
}
