export * from './types';
import { FutureResult, ok, err } from 'literium-base';
import { Method, Status, DataType, GenericBody, Headers } from './types';
import { request as backend } from './server';

export interface RequestWithoutBody<TMethod extends Method> {
    method: TMethod;
    url: string;
    headers?: Headers;
    timeout?: number;
}

export interface RequestWithBody<TMethod extends Method> extends RequestWithoutBody<TMethod> {
    body: GenericBody;
}

export interface WithResponseBody<TData extends DataType> {
    response: TData;
}

export type Request<TMethod extends Method, TResData extends DataType> = RequestWithoutBody<TMethod> | RequestWithBody<TMethod> | RequestWithoutBody<TMethod> & WithResponseBody<TResData> | RequestWithBody<TMethod> & WithResponseBody<TResData>;

export type GenericRequest = Request<Method, DataType>;

export interface ResponseWithoutBody {
    status: Status;
    message: string;
    headers: Headers;
}

export interface ResponseWithBody<Body extends GenericBody> extends ResponseWithoutBody {
    body: Body;
}

export type Response<Body extends GenericBody> = ResponseWithoutBody | ResponseWithBody<Body>;

export type FutureResponse<Body extends GenericBody> = FutureResult<Response<Body>, Error>;

export type FutureResponseWithoutBody = FutureResult<ResponseWithoutBody, Error>;

export type FutureResponseWithBody<Body extends GenericBody> = FutureResult<ResponseWithBody<Body>, Error>;

export type GenericResponse = Response<GenericBody>;

export type GenericFutureResponse = FutureResponse<GenericBody>;

function uploadable(method: Method): boolean {
    return method == Method.Post || method == Method.Put || method == Method.Patch;
}

function downloadable(method: Method): boolean {
    return method != Method.Head && method != Method.Delete && method != Method.Options;
}

export type MethodWithoutResponseBody = Method.Head | Method.Delete | Method.Options;

export type MethodWithRequestBody = Method.Post | Method.Put | Method.Patch;

export function request(req: RequestWithoutBody<MethodWithoutResponseBody>): FutureResponseWithoutBody;
export function request(req: RequestWithoutBody<Method.Get> & WithResponseBody<DataType.String>): FutureResponseWithBody<string>;
export function request(req: RequestWithoutBody<Method.Get> & WithResponseBody<DataType.Binary>): FutureResponseWithBody<ArrayBuffer>;
export function request(req: RequestWithBody<MethodWithRequestBody>): FutureResponseWithoutBody;
export function request(req: RequestWithBody<MethodWithRequestBody> & WithResponseBody<DataType.String>): FutureResponseWithBody<string>;
export function request(req: RequestWithBody<MethodWithRequestBody> & WithResponseBody<DataType.Binary>): FutureResponseWithBody<ArrayBuffer>;

export function request(req: GenericRequest): GenericFutureResponse {
    return send => {
        let timer: any;
        const abort = backend(req.method, req.url, req.headers || {}, uploadable(req.method) ? (req as RequestWithBody<Method>).body : undefined, downloadable(req.method) ? (req as WithResponseBody<DataType>).response : undefined, (status: number, message: string, headers: Headers, body?: GenericBody) => {
            const res: Response<GenericBody> = { status, message, headers, body };
            clearTimeout(timer);
            send(ok(res));
        }, (error: Error) => {
            send(err(error));
        });
        if (req.timeout) {
            timer = setTimeout(abort, req.timeout);
        }
        return abort;
    };
}
