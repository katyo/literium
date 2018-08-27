import { FutureResult, ok, err, mk_seq, map_future_err, err_to_str, do_seq, wrap_future, constant, then_option, ok_def_or, ok_some_or, future, then_future_ok, ErrFn } from '@literium/base';
import { Route, build, match } from '@literium/router';
import { Method, BodyType, DataType, Status, RequestApi } from '@literium/request';

export type Result<T> = FutureResult<T, string>;

//export type Arg0Type<F> = F extends (a: infer A, ...x: any[]) => infer R ? A : never;

export interface Get<Id, Data> {
    ($: Id): Result<Data>;
}

export interface Post<CId, Id, Data> {
    ($: CId, _: Data): Result<Id>;
}

export interface Put<Id, Data> {
    ($: Id, _: Data): Result<void>;
}

export interface Del<Id> {
    ($: Id): Result<void>;
}

const map_err_str = /*@__PURE__*/map_future_err(err_to_str);

export function get<Id, Data, N extends DataType>(request: RequestApi, r: Route<Id>, t: BodyType<Data, N>): Get<Id, Data> {
    return mk_seq(
        build(r),
        then_option(url => do_seq(
            request({
                url,
                method: Method.Get,
                response: t,
            }),
            map_err_str,
            then_future_ok(res => future(res.status == Status.Ok ?
                ok(res.body) : err('invalid status')))
        ), wrap_future(constant(err('invalid args')))),
    );
}

export function post<CId, Id, Data, N extends DataType>(request: RequestApi, r: Route<CId>, t: BodyType<Data, N>, g: Route<Id>): Post<CId, Id, Data> {
    const p = match(g);
    return ($: CId, _: Data) => do_seq(
        $,
        build(r),
        then_option(url => do_seq(
            request({
                url,
                method: Method.Put,
                request: t,
                body: _,
            }),
            map_err_str,
            then_future_ok(res => future(res.status == Status.Created ?
                ok(res) : (err as ErrFn<typeof res>)('invalid status'))),
            then_future_ok(res => future(ok_def_or('no location')(res.headers.location))),
            then_future_ok(url => future(ok_some_or('invalid location')(p(url))))
        ), wrap_future(constant(err('invalid args'))))
    );
}

export function put<Id, Data, N extends DataType>(request: RequestApi, r: Route<Id>, t: BodyType<Data, N>): Put<Id, Data> {
    return (a: Id, v: Data) => do_seq(
        a,
        build(r),
        then_option(url => do_seq(
            request({
                url,
                method: Method.Put,
                request: t,
                body: v,
            }),
            map_err_str,
            then_future_ok(res => future(res.status == Status.NoContent ?
                ok(undefined) : err('invalid status')))
        ), wrap_future(constant(err('invalid args')))),
    );
}

export function del<Id, Data, N extends DataType>(request: RequestApi, r: Route<Id>): Del<Id> {
    return (a: Id) => do_seq(
        a,
        build(r),
        then_option(url => do_seq(
            request({
                url,
                method: Method.Delete,
            }),
            map_err_str,
            then_future_ok(res => future(res.status == Status.NoContent ?
                ok(undefined) : err('invalid status')))
        ), wrap_future(constant(err('invalid args'))))
    );
}
