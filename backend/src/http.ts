import { Option, some, none, Result, ok, is_ok, un_ok, FutureResult, mk_seq, ok_try, then_ok, map_err, err_to_str, un_err, then_future_ok, wrap_future, map_ok, future_ok, is_some, un_some } from 'literium-base';
import * as Json from 'literium-json';
import { ServerResponse, ServerRequest } from 'http';
import { read_all_from_stream, data_to_stream } from './stream';
import { Readable } from 'stream';

export interface BodyType<T> {
    // default mime type
    t: Option<string>;
    // read from request
    p(b: Readable): FutureResult<T, string>;
    // write to response
    b(v: T): Result<Readable, string>;
}

const map_err_to_str = map_err(err_to_str);

export const StreamBody: BodyType<Readable> = {
    t: none(),
    p: future_ok,
    b: ok,
};

export const OctetStreamBody: BodyType<Readable> = {
    ...StreamBody,
    t: some('application/octet-stream'),
};

export const BinaryBody: BodyType<Buffer> = {
    t: some('application/octet-stream'),
    p: read_all_from_stream,
    b: mk_seq(data_to_stream, ok as (_: Readable) => Result<Readable, string>)
};

export const OctetBinaryBody: BodyType<Buffer> = {
    ...BinaryBody,
    t: some('application/octet-stream'),
};

export const StringBody: BodyType<string> = {
    t: none(),
    p: mk_seq(
        read_all_from_stream,
        then_future_ok(wrap_future(mk_seq(
            ok_try((b: Buffer) => b.toString('UTF-8')),
            map_err_to_str
        ))),
    ),
    b: mk_seq(
        ok_try((v: string) => Buffer.from(v, 'UTF-8')),
        map_ok(data_to_stream),
        map_err_to_str
    )
};

export const TextBody: BodyType<string> = {
    ...StringBody,
    t: some('text/plain')
};

export const HtmlBody: BodyType<string> = {
    ...StringBody,
    t: some('text/html')
};

export function JsonBody<T>(t: Json.Type<T>, m?: string): BodyType<T> {
    return {
        t: some(m || 'application/json'),
        p: mk_seq(
            StringBody.p,
            then_future_ok(wrap_future(Json.parse(t)))
        ),
        b: mk_seq(
            Json.build(t),
            then_ok(StringBody.b)
        )
    };
}

export function request_body(req: ServerRequest): <T>(typ: BodyType<T>) => FutureResult<T, string> {
    return <T>(typ: BodyType<T>) => typ.p(req);
}

export interface ResponseWithoutBody {
    status: number;
    message: string;
    headers?: Record<string, string>;
}

export interface ResponseWithBody<T> extends ResponseWithoutBody {
    response: BodyType<T>;
    body: T;
}

export type ResponseData<T> = ResponseWithoutBody | ResponseWithBody<T>;

function hasResponseBody<T>(d: ResponseData<T>): d is ResponseWithBody<T> {
    return !!(d as ResponseWithBody<T>).response;
}

export type FutureResponse<T> = FutureResult<ResponseData<T>, string>;

export function respond(res: ServerResponse): <T>(fut: FutureResponse<T>) => void {
    return <T>(fut: FutureResponse<T>) => {
        fut(r => {
            if (is_ok(r)) {
                const data = un_ok(r);
                let body = hasResponseBody(data) ? data.response.b(data.body) : ok(undefined);
                if (is_ok(body)) {
                    const { status, message, headers } = data;
                    res.writeHead(status, message, headers);
                    if (body._) {
                        body._.pipe(res);
                    } else {
                        res.end();
                    }
                    return;
                }
            }
            res.writeHead(500, 'Internal error');
            res.end(un_err(r));
        });
    }
}

export interface Handler<T> {
    (req: ServerRequest): FutureResponse<T>;
}

export function handler_to_node<T>(handler: Handler<T>): (req: ServerRequest, res: ServerResponse) => void {
    return (req: ServerRequest, res: ServerResponse) => respond(res)(handler(req));
}

export function okay(): ResponseWithoutBody {
    return { status: 200, message: "Ok" };
}

export function created(location: string): ResponseWithoutBody {
    return { status: 201, message: "Created", headers: { location } };
}

export function no_content(): ResponseWithoutBody {
    return { status: 204, message: "No content" };
}

export function bad_request(): ResponseWithoutBody {
    return { status: 400, message: "Bad request" };
}

export function forbidden(): ResponseWithoutBody {
    return { status: 403, message: "Forbidden" };
}

export function not_found(): ResponseWithoutBody {
    return { status: 404, message: "Not found" };
}

export function with_header(name: string, value: string): (res: ResponseWithoutBody) => ResponseWithoutBody {
    return (res: ResponseWithoutBody) => {
        res.headers = res.headers || {};
        res.headers[name] = value;
        return res;
    };
}

export function with_body<T>(t: BodyType<T>, b: T, m?: string): (res: ResponseWithoutBody) => ResponseWithBody<T> {
    return (res: ResponseWithoutBody) => {
        if (is_some(t.t)) with_header('content-type', un_some(t.t))(res);
        if (m) with_header('content-type', m)(res);
        (res as ResponseWithBody<T>).response = t;
        (res as ResponseWithBody<T>).body = b;
        return res as ResponseWithBody<T>;
    };
}
