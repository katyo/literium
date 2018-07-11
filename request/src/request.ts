export { Method, Status, Headers, DataType, BodyType, NativeBody, NativeType } from './types';
export { JsonBody } from './json';

import { Emit, FutureResult, Result, ok, err, do_seq, map_ok, then_future_ok, future, dummy, deferred } from 'literium-base';
import { Method, Status, DataType, BodyType, NativeBody, Headers } from './types';
import { request as backend } from './server';

export const StrBody: BodyType<string, DataType.String> = {
    t: DataType.String,
    p: d => ok(d),
    b: d => ok(d),
};

export const BinBody: BodyType<ArrayBuffer, DataType.Binary> = {
    t: DataType.Binary,
    p: d => ok(d),
    b: d => ok(d),
};

export type MethodWithRequestBody = Method.Post | Method.Put | Method.Patch;

export type MethodWithoutResponseBody = Method.Head | Method.Delete | Method.Options;

export interface Progress {
    left: number;
    size: number;
    down: boolean;
}

export interface RequestWithoutBody<TMethod extends Method> {
    method: TMethod;
    url: string;
    headers?: Headers;
    progress?: Emit<Progress>;
}

export interface RequestWithBody<TMethod extends Method, TBody, TData extends BodyType<TBody, DataType>> extends RequestWithoutBody<TMethod> {
    request: TData;
    body: TBody;
}

export interface WithResponseBody<TBody, TData extends BodyType<TBody, DataType>> {
    response: TData;
}

export interface ResponseWithoutBody {
    status: Status;
    message: string;
    headers: Headers;
}

export interface ResponseWithBody<TBody> extends ResponseWithoutBody {
    body: TBody;
}

export type FutureResponseWithoutBody = FutureResult<ResponseWithoutBody, Error>;

export type FutureResponseWithBody<TBody> = FutureResult<ResponseWithBody<TBody>, Error>;

export interface RequestApi {
    // request and response without bodies
    (request: RequestWithoutBody<MethodWithoutResponseBody>): FutureResponseWithoutBody;
    // request without body and with response body
    <ResBody, ResNType extends DataType, ResData extends BodyType<ResBody, ResNType>>(request: RequestWithoutBody<Method.Get> & WithResponseBody<ResBody, ResData>): FutureResponseWithBody<ResBody>;
    // request with body and response without
    <ReqBody, ReqNType extends DataType, ReqData extends BodyType<ReqBody, ReqNType>>(request: RequestWithBody<MethodWithRequestBody, ReqBody, ReqData>): FutureResponseWithoutBody;
    // both request and response with bodies
    <ReqBody, ReqNType extends DataType, ReqData extends BodyType<ReqBody, ReqNType>, ResBody, ResNType extends DataType, ResData extends BodyType<ResBody, ResNType>>(request: RequestWithBody<MethodWithRequestBody, ReqBody, ReqData> & WithResponseBody<ResBody, ResData>): FutureResponseWithBody<ResBody>;
}

type NativeBodyType = BodyType<any, DataType>;

interface GenericRequest {
    method: Method;
    url: string;
    headers?: Headers;
    progress?: Emit<Progress>;
    request?: NativeBodyType;
    body?: any;
    response?: NativeBodyType;
}

interface GenericResponse {
    status: Status;
    message: string;
    headers: Headers;
    body?: any;
}

export type GenericFutureResponse = FutureResult<GenericResponse, Error>;

export const request = ((req: GenericRequest) =>
    do_seq(
        // parse request body
        future((uploadable(req.method) && req.request ? req.request.b(req.body) :
            ok(undefined)) as Result<NativeBody | void, Error>),
        // run request
        then_future_ok(req_body => <GenericFutureResponse>(emit => {
            let final = false;
            const abort = backend(req.method, req.url, req.headers || {}, req_body, downloadable(req.method) && req.response ? req.response!.t : undefined, (status: number, message: string, headers: Headers, body?: NativeBody) => {
                if (!final) {
                    final = true;
                    const res: GenericResponse = { status, message, headers, body };
                    emit(ok(res));
                }
            }, (error: Error) => {
                if (!final) {
                    final = true;
                    if (abort) {
                        emit(err(error));
                    } else { // defer sync error
                        deferred(emit)(err(error));
                    }
                }
            }, req.progress ? (left: number, size: number, down: boolean) => {
                (req.progress as Emit<Progress>)({ left, size, down });
            } : dummy);
            return () => {
                if (!final) {
                    final = true;
                    abort();
                }
            };
        })),
        // build response data
        then_future_ok(res => future(downloadable(req.method) && req.response ?
            do_seq(
                req.response.p(res.body),
                map_ok(body => (res.body = body, res))
            ) : ok(res)))
    )) as RequestApi;

function uploadable(method: Method): boolean {
    return method == Method.Post || method == Method.Put || method == Method.Patch;
}

function downloadable(method: Method): boolean {
    return method != Method.Head && method != Method.Delete && method != Method.Options;
}
