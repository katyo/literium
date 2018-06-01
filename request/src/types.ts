export const enum Method {
    Get = 'GET',
    Post = 'POST',
    Put = 'PUT',
    Delete = 'DELETE',
    Head = 'HEAD',
    Patch = 'PATCH',
    Options = 'OPTIONS',
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

export type Headers = Record<string, string>;

export const enum DataType {
    String,
    Binary,
}

export type GenericBody = string | ArrayBuffer;

export type ResFn = (status: number, message: string, headers: Headers, body: GenericBody | void) => void;
export type ErrFn = (error: Error) => void;
export type AbrFn = () => void;
export type ReqFn = (method: Method, url: string, headers: Headers, body: GenericBody | void, res_type: DataType | void, res_fn: ResFn, err: ErrFn) => AbrFn;
