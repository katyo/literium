import { ServerResponse, ServerRequest } from 'http';
import { Readable } from 'stream';
import { ok, is_ok, un_ok, Result, FutureResult, un_err, is_some, un_some } from 'literium-base';
import { BodyType } from './body';

export const enum Method {
    Get = 'GET',
    Post = 'POST',
    Put = 'PUT',
    Delete = 'DELETE',
    Head = 'HEAD',
    Patch = 'PATCH',
    Options = 'OPTIONS',
}

export interface Request {
    url: string;
    method: Method;
    header(name: string): string[];
    body<T>(typ: BodyType<T>): FutureResult<T, string>;
}

function request_from_node(req: ServerRequest): Request {
    return {
        url: req.url || '',
        method: req.method as Method, /* TODO: Check method */
        header: (name: string) => {
            const value = req.headers[name];
            return typeof value == 'string' ? [value] : value || [];
        },
        body: <T>(typ: BodyType<T>) => typ.p(req),
    }
}

export interface Response {
    status: number;
    message: string;
    headers?: Record<string, string[]>;
    body?: () => Result<Readable, string>;
}

function response_to_node({ status, message, headers, body }: Response, res: ServerResponse): boolean {
    let data = body ? body() : ok(undefined);
    if (is_ok(data)) {
        res.writeHead(status, message, headers);
        if (data._) {
            data._.pipe(res);
        } else {
            res.end();
        }
        return true;
    }
    return false;
}

export type FutureResponse = FutureResult<Response, string>;

function respond(res: ServerResponse): (fut: FutureResponse) => void {
    return <T>(fut: FutureResponse) => {
        fut(r => {
            if (is_ok(r)) {
                const data = un_ok(r);
                if (response_to_node(data, res)) {
                    return;
                }
            }
            res.writeHead(500, 'Internal error');
            res.end(un_err(r));
        });
    }
}

export interface Handler {
    (req: Request): FutureResponse;
}

export function handler_to_node(handler: Handler): (req: ServerRequest, res: ServerResponse) => void {
    return (req: ServerRequest, res: ServerResponse) => respond(res)(handler(request_from_node(req)));
}

export function okay(): Response {
    return { status: 200, message: "Ok" };
}

export function created(location: string): Response {
    return with_header('location', [location])({ status: 201, message: "Created" });
}

export function no_content(): Response {
    return { status: 204, message: "No content" };
}

export function bad_request(): Response {
    return { status: 400, message: "Bad request" };
}

export function forbidden(): Response {
    return { status: 403, message: "Forbidden" };
}

export function not_found(): Response {
    return { status: 404, message: "Not found" };
}

export interface ResponseMod {
    (res: Response): Response;
}

export function with_header(name: string, value: string[]): ResponseMod {
    return (res: Response) => {
        res.headers = res.headers || {};
        res.headers[name] = value;
        return res;
    };
}

export function with_body<T>(body_type: BodyType<T>, body_data: T, mime_type?: string): ResponseMod {
    return (res: Response) => {
        if (is_some(body_type.t)) with_header('content-type', [un_some(body_type.t)])(res);
        if (mime_type) with_header('content-type', [mime_type])(res);
        res.body = () => body_type.b(body_data);
        return res;
    };
}
