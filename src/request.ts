import { Fork } from './types';
import { request as browser_request } from './client/request';

const request_backend: ReqFn = typeof window != 'undefined' ? browser_request : require('./request/node').request;

export const enum Method {
    Get = 'GET',
    Post = 'POST',
    Put = 'PUT',
    Delete = 'DELETE',
    Head = 'HEAD',
    Patch = 'PATCH',
    Options = 'OPTIONS',
}

export type Headers = Record<string, string>;

export type ResFn = (status: number, message: string, headers: Headers, body?: Buffer) => void;
export type ErrFn = (error: Error) => void;
export type AbrFn = () => void;
export type ReqFn = (method: Method, url: string, headers: Headers, body: Buffer | undefined, need_body: boolean, res: ResFn, err: ErrFn) => AbrFn;

function uploadable(method: Method): boolean {
    return method == Method.Post || method == Method.Put || method == Method.Patch;
}

function downloadable(method: Method): boolean {
    return method != Method.Head && method != Method.Delete && method != Method.Options;
}

export interface Request {
    method: Method;
    url: string;
    headers?: Headers;
    body?: Buffer;
    stream?: boolean;
    timeout?: number;
}

export interface Response {
    status: Status;
    message: string;
    headers: Headers;
    body?: Buffer;
}

export const enum Status {
    Continue = 100,
    SwitchProto = 101,
    Processing = 102,

    Ok = 200,
    Created = 201,
    Accepted = 202,
    NonAuthoritative = 203,
    NoContent = 204,
    ResetContent = 205,
    PartialContent = 206,
    MultiStatus = 207,
    AlreadyReported = 208,

    MultipleChoices = 300,
    MovedPermanently = 301,
    Found = 302,
    MovedTemporarily = 302,
    SeeOther = 303,
    NotModified = 304,
    UseProxy = 305,
    TemporarilyRedirect = 307,
    PermanentRedirect = 308,

    BadRequest = 400,
    Unauthorized = 401,
    PaymentRequired = 402,
    Forbidden = 403,
    NotFound = 404,
    NotAllowed = 405,
    NotAcceptable = 406,
    ProxyAuthRequired = 407,
    RequestTimeout = 408,
    Conflict = 409,
    Gone = 410,
    LengthRequired = 411,
    PreconditionFailed = 412,
    PayloadTooLarge = 413,
    UriTooLong = 414,
    UnsupportedMediaType = 415,
    RangeNotSatisfiable = 416,
    ExpectationFailed = 417,
    ImTeapot = 418,
    MisdirectedRequest = 421,
    UnprocessableEntity = 422,
    Locked = 423,
    FailedDependency = 424,
    UpgradeRequired = 426,
    PreconditionRequired = 428,
    TooManyRequests = 429,
    HeadersTooLarge = 431,
    NoHeadersClose = 444,
    RetryWith = 449,
    UnavailableForLegalReasons = 451,

    InternalServerError = 500,
    NotImplemented = 501,
    BadGateway = 502,
    ServiceUnavailable = 503,
    GatewayTimeout = 504,
    HttpVersionNotSupported = 505,
    VariantAlsoNegotiates = 506,
    InsufficientStorage = 507,
    LoopDetected = 508,
    BandwidthLimitExceeded = 509,
    NotExtended = 510,
    NetworkAuthRequired = 511,
    UnknownError = 520,
    WebServerIsDown = 521,
    ConnectionTimedOut = 522,
    OriginIsUnreachable = 523,
    TimeoutOccured = 524,
    SSLHandshakeFailed = 525,
    InvalidSSLCertificate = 526,
}

export type Event = Response | Error;

export function request(fork: Fork<Event>, req: Request) {
    const [send, done] = fork();
    let timer: any;
    const abort = request_backend(req.method, req.url, req.headers || {}, uploadable(req.method) ? req.body : undefined, downloadable(req.method), (status: number, message: string, headers: Headers, body?: Buffer) => {
        const res: Response = { status, message, headers };
        if (body) {
            res.body = body;
        }
        clearTimeout(timer);
        send(res);
        done();
    }, (err: Error) => {
        send(err);
    });
    if (req.timeout) {
        timer = setTimeout(abort, req.timeout);
    }
}
