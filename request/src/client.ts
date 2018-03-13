import { Method, Headers, ResFn, ErrFn, AbrFn } from './request';

export function request(method: Method, url: string, headers: Headers, body: Buffer | undefined, need_body: boolean, res_fn: ResFn, err_fn: ErrFn): AbrFn {
    let xhr = new XMLHttpRequest();
    
    xhr.open(method, url, true);
    for (let name in headers) {
        xhr.setRequestHeader(name, headers[name]);
    }

    xhr.onreadystatechange = () => {
        xhr_on(xhr, res_fn, need_body);
    };
    
    if (need_body) {
        download_init(xhr);
    }
    
    try {
        if (body) {
            upload(xhr, body);
        } else {
            xhr.send(null);
        }
    } catch (error) {
        delete xhr.onreadystatechange;
        err_fn(error);
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

function xhr_on(xhr: XMLHttpRequest, res_fn: ResFn, need_body: boolean) {
    switch (xhr.readyState) {
    case 4: { // done
        delete xhr.onreadystatechange;
        res_fn(xhr.status, xhr.statusText, parseHeaders(xhr.getAllResponseHeaders()), need_body ? download_done(xhr) : undefined);
    } break;
    }
};

interface XHRAPI {
    upload(xhr: XMLHttpRequest, buf: Buffer): void;
    download_init(xhr: XMLHttpRequest): void;
    download_done(xhr: XMLHttpRequest): Buffer | undefined;
}

const {upload, download_init, download_done} = xhrapi_new();

function bodyFrom(data: string | ArrayBuffer): Buffer | undefined {
    if (data == undefined) {
        return undefined;
    }
    if (typeof data == 'string') {
        return Buffer.from(data, 'binary');
    }
    return Buffer.from(data as ArrayBuffer);
}

interface MozXMLHttpRequest {
    sendAsBinary(data: any): void;
}

function xhrapi_new(): XHRAPI {
    if (typeof window == 'undefined') {
        return {
            upload: (xhr: XMLHttpRequest, buf: Buffer) => {
		            xhr.send(buf);
            },
            download_init: (xhr: XMLHttpRequest) => {
            },
            download_done: (xhr: XMLHttpRequest) => {
                return bodyFrom(xhr.responseText);
            }
        };
    }
    
    var xhr = new XMLHttpRequest();
    xhr.open('get', '/', true);
    var buf = Buffer.allocUnsafe(1);
    
    const upload = typeof (xhr as any as MozXMLHttpRequest).sendAsBinary == 'function' ? (xhr: XMLHttpRequest, buf: Buffer) => {
        // upload binary string using Mozilla-specific sendAsBinary method
        (xhr as any as MozXMLHttpRequest).sendAsBinary(buf.buffer);
    } : typeof Uint8Array == 'function' ? // upload array buffer using XHR send method
    (buf instanceof Uint8Array ? (xhr: XMLHttpRequest, buf: Buffer) => {
		    xhr.send(buf.byteOffset === 0 && buf.byteLength === buf.buffer.byteLength ?
                 // If the buffer isn't a subarray, return the underlying ArrayBuffer
                 buf.buffer :
			           // Otherwise we need to get a proper copy
			           buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    } : (xhr: XMLHttpRequest, buf: Buffer) => {
        // This is the slow version that will work with any Buffer
		    // implementation (even in old browsers)
		    var arrayCopy = new Uint8Array(buf.length);
		    var len = buf.length;
		    for (var i = 0; i < len; i++) {
			      arrayCopy[i] = buf[i];
		    }
		    xhr.send(arrayCopy.buffer);
    }) : (xhr: XMLHttpRequest, buf: Buffer) => {
        // upload as binary DOMString (fallback)
        xhr.send(buf.toString('binary'));
    };

    const [download_init, download_done] = (xhr => {
        if ('responseType' in xhr) {
            try {
                xhr.responseType = 'arraybuffer';
                // download array buffer using XHR responseType field
                return 'response' in xhr && xhr.responseType == 'arraybuffer';
            } catch (error) {}
        }
        return false;
    })(xhr) ? [(xhr: XMLHttpRequest) => {
        xhr.responseType = 'arraybuffer';
    }, (xhr: XMLHttpRequest) => {
        return bodyFrom(xhr.response as ArrayBuffer);
    }] : typeof xhr.overrideMimeType == 'function' ? [(xhr: XMLHttpRequest) => {
        // download binary string through overriding mime type
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
    }, (xhr: XMLHttpRequest) => {
        return bodyFrom(xhr.responseText);
    }] : [(xhr: XMLHttpRequest) => {
        // download binary string as DOMString
    }, (xhr: XMLHttpRequest) => {
        return bodyFrom(xhr.responseText);
    }];
    
    return {
        upload,
        download_init,
        download_done,
    };
}
