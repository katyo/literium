import { Option, some, none, Result, ok, FutureResult, mk_seq, ok_try, then_ok, map_err, err_to_str, then_future_ok, wrap_future, map_ok, future_ok } from '@literium/base';
import * as Json from '@literium/json';
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
