import { Option, Result, FutureResult, Emit, AsKeyed, HasField, HasExtra, WithExtra, join_future_result, do_seq, map_future_ok, constant, future_err, future_ok } from '@literium/base';

export const enum Method {
    Get = 'GET',
    Post = 'POST',
    Put = 'PUT',
    Delete = 'DELETE',
    Head = 'HEAD',
    Patch = 'PATCH',
    Options = 'OPTIONS',
    Trace = 'TRACE',
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

export const enum StatusKind {
    Info = 1,
    Success = 2,
    Redirect = 3,
    ClientError = 4,
    ServerError = 5,
}

export const enum ErrorKind {
    Request,
    Upload,
    Download,
    IntoHead,
    FromHead,
    IntoBody,
    FromBody,
}

export type Error = AsKeyed<{
    [ErrorKind.Request]: void;
    [ErrorKind.Upload]: void;
    [ErrorKind.Download]: void;
    [ErrorKind.IntoHead]: string;
    [ErrorKind.FromHead]: string;
    [ErrorKind.IntoBody]: string;
    [ErrorKind.FromBody]: string;
}>;

export const enum BodyType {
    String,
    Binary,
}

export interface BodyTypeMap {
    [BodyType.String]: string;
    [BodyType.Binary]: ArrayBuffer;
}

export interface Progress {
    loaded: number,
    total: Option<number>,
}

export const enum ProgressType {
    Upload = 1,
    Download = 2,
    Both = 3,
}

export const enum ApiTag {
    Request,
    RequestHeaders,
    RequestBody,
    Response,
    ResponseHeaders,
    ResponseBody,
    ResponseStringBody,
    ResponseBinaryBody,
}

export interface RequestApi {
    /// Api tag
    $: ApiTag.Request;
    /// Set method
    m(method: Method): void;
    /// Set origin
    o(origin: string): void;
    /// Set path
    p(path: string): void;
    /// Set query
    q(query: string): void;
}

export interface RequestHeadersApi {
    /// Api tag
    $: ApiTag.RequestHeaders;
    /// Set header
    h(name: string, value: string): void;
}

export interface RequestBodyApi {
    /// Api tag
    $: ApiTag.RequestBody;
    /// Send string body
    s(content: string): void;
    /// Send binary body
    b(content: ArrayBuffer): void;
    /// Set uploading progress handler
    p(progress: Emit<Progress>): void;
}

export interface ResponseBodyApi {
    /// Api tag
    $: ApiTag.ResponseBody;
    /// Set response body type
    /// You need call this to make response body awailable
    b(body: BodyType): void;
    /// Set downloading progress handler
    p(progress: Emit<Progress>): void;
}

export interface ResponseApi {
    /// Api tag
    $: ApiTag.Response;
    /// Response status
    s: Status;
    /// Reason message
    m: string;
}

export interface ResponseHeadersApi {
    /// Api tag
    $: ApiTag.ResponseHeaders;
    /// Get response header
    h(name: string): Option<string>;
}

export interface ResponseStringBodyApi {
    /// Api tag
    $: ApiTag.ResponseStringBody;
    /// String body content
    s: string;
}

export interface ResponseBinaryBodyApi {
    /// Api tag
    $: ApiTag.ResponseBinaryBody;
    /// Binary body content
    b: ArrayBuffer;
}

export type PluginApi
    = RequestApi
    | RequestHeadersApi
    | RequestBodyApi
    | ResponseBodyApi
    | ResponseApi
    | ResponseHeadersApi
    | ResponseStringBodyApi
    | ResponseBinaryBodyApi;

export type PluginResult = FutureResult<void, Error>;

export interface Plugin<A, R> {
    (api: PluginApi, arg: A, res: R): PluginResult;
}

export function mix_plugin<A, R>(p: Plugin<A, R>): Plugin<A, R>;
export function mix_plugin<A1, R1, A2, R2>(p1: Plugin<A1, R1>, p2: Plugin<A2, R2>): Plugin<A1 & A2, R1 & R2>;
export function mix_plugin<A1, R1, A2, R2, A3, R3>(p1: Plugin<A1, R1>, p2: Plugin<A2, R2>, p3: Plugin<A3, R3>): Plugin<A1 & A2 & A3, R1 & R2 & R3>;
export function mix_plugin<A1, R1, A2, R2, A3, R3, A4, R4>(p1: Plugin<A1, R1>, p2: Plugin<A2, R2>, p3: Plugin<A3, R3>, p4: Plugin<A4, R4>): Plugin<A1 & A2 & A3 & A4, R1 & R2 & R3 & R4>;
export function mix_plugin<A1, R1, A2, R2, A3, R3, A4, R4, A5, R5>(p1: Plugin<A1, R1>, p2: Plugin<A2, R2>, p3: Plugin<A3, R3>, p4: Plugin<A4, R4>, p5: Plugin<A5, R5>): Plugin<A1 & A2 & A3 & A4 & A5, R1 & R2 & R3 & R4 & R5>;
export function mix_plugin<A1, R1, A2, R2, A3, R3, A4, R4, A5, R5, A6, R6>(p1: Plugin<A1, R1>, p2: Plugin<A2, R2>, p3: Plugin<A3, R3>, p4: Plugin<A4, R4>, p5: Plugin<A5, R5>, p6: Plugin<A6, R6>): Plugin<A1 & A2 & A3 & A4 & A5 & A6, R1 & R2 & R3 & R4 & R5 & R6>;
export function mix_plugin<A1, R1, A2, R2, A3, R3, A4, R4, A5, R5, A6, R6, A7, R7>(p1: Plugin<A1, R1>, p2: Plugin<A2, R2>, p3: Plugin<A3, R3>, p4: Plugin<A4, R4>, p5: Plugin<A5, R5>, p6: Plugin<A6, R6>, p7: Plugin<A7, R7>): Plugin<A1 & A2 & A3 & A4 & A5 & A6 & A7, R1 & R2 & R3 & R4 & R5 & R6 & R7>;
export function mix_plugin<A1, R1, A2, R2, A3, R3, A4, R4, A5, R5, A6, R6, A7, R7, A8, R8>(p1: Plugin<A1, R1>, p2: Plugin<A2, R2>, p3: Plugin<A3, R3>, p4: Plugin<A4, R4>, p5: Plugin<A5, R5>, p6: Plugin<A6, R6>, p7: Plugin<A7, R7>, p8: Plugin<A8, R8>): Plugin<A1 & A2 & A3 & A4 & A5 & A6 & A7 & A8, R1 & R2 & R3 & R4 & R5 & R6 & R7 & R8>;
export function mix_plugin<A1, R1, A2, R2, A3, R3, A4, R4, A5, R5, A6, R6, A7, R7, A8, R8, A9, R9>(p1: Plugin<A1, R1>, p2: Plugin<A2, R2>, p3: Plugin<A3, R3>, p4: Plugin<A4, R4>, p5: Plugin<A5, R5>, p6: Plugin<A6, R6>, p7: Plugin<A7, R7>, p8: Plugin<A8, R8>, p9: Plugin<A9, R9>): Plugin<A1 & A2 & A3 & A4 & A5 & A6 & A7 & A8 & A9, R1 & R2 & R3 & R4 & R5 & R6 & R7 & R8 & R9>;

export function mix_plugin(...plugins: Plugin<any, any>[]): Plugin<any, any> {
    return (api: PluginApi, arg: any, res: any) => do_seq(
        plugins.map(plugin => plugin(api, arg, res)),
        futures => (join_future_result as (...fs: FutureResult<any, Error>[]) => FutureResult<Option<any>[], Error>)(...futures),
        map_future_ok(constant(res)),
    ) as PluginResult;
}

export interface Request<A, R> {
    (args: A): FutureResult<R, Error>;
}

export interface FromArg<T, XA = {}, XR = {}> {
    <F extends keyof A, A extends WithExtra<HasField<F, T>, XA>, R extends HasExtra<XR>>(field: F): Plugin<A, R>;
    <A extends WithExtra<T, XA>, R extends HasExtra<XR>>(): Plugin<A, R>;
}

export interface FromArgFn<B, XT = {}, XA = {}, XR = {}> {
    <T extends HasExtra<XT>, A extends HasExtra<XA>, R extends HasExtra<XR>>(fn: (val: T, arg: A, res: R) => Result<B, string>): FromArg<T, A, R>;
    <A extends HasExtra<XA>, R extends HasExtra<XR>>(): FromArg<B, A, R>;
}

export interface IntoRes<T, XA = {}, XR = {}> {
    <F extends keyof R, A extends HasExtra<XA>, R extends WithExtra<HasField<F, T>, XR>>(field: F): Plugin<A, R>;
    <A extends HasExtra<XA>, R extends WithExtra<T, XR>>(): Plugin<A, R>;
}

export interface IntoResFn<B, XT = {}, XA = {}, XR = {}> {
    <T extends HasExtra<XT>, A extends HasExtra<XA>, R extends HasExtra<XR>>(fn: (val: B, arg: A, res: R) => Result<T, string>): IntoRes<T, A, R>;
    <A extends HasExtra<XA>, R extends HasExtra<XR>>(): IntoRes<B, A, R>;
}

export interface Named<T> {
    (name: string): T;
}

export interface FromArgOrWithEmit<T, XA = {}, XR = {}> {
    <F extends keyof A, A extends WithExtra<HasField<F, Emit<T>>, XA>, R extends HasExtra<XR>>(field: F): Plugin<A, R>;
    <A extends HasExtra<XA>, R extends HasExtra<XR>>(emit: Emit<T>): Plugin<A, R>;
}

export const dummy_plugin = () => plugin_done;

export { future_err as plugin_fail };
export const plugin_done: PluginResult = future_ok();
