import { HasField } from '@literium/base';
import { Route } from '@literium/router';
import { Method, Status, Plugin, mix_plugin, dummy_plugin } from './types';
import { route_from, route_into } from './route';
import { method_use, origin_from, status_exact } from './plugins';

export type HasBase = HasField<'base', string>;

export function rest_get<U, A, R>(req_route: Route<U>, res_body: Plugin<A, R>): Plugin<U & A & HasBase, R> {
    return mix_plugin(
        method_use(Method.Get),
        origin_from()('base'),
        route_from(req_route)(),
        status_exact(Status.Ok),
        res_body
    );
}

export function rest_post<U, A, R>(req_route: Route<U>, req_body: Plugin<A, R>): Plugin<U & A & HasBase, R>;
export function rest_post<U, A, R, L>(req_route: Route<U>, req_body: Plugin<A, R>, res_route: Route<L>): Plugin<U & A & HasBase, L & R>;
export function rest_post<U, A, R, L, B, T>(req_route: Route<U>, req_body: Plugin<A, R>, res_route: Route<L>, res_body: Plugin<B, T>): Plugin<U & A & B & HasBase, L & R & T>;
export function rest_post<U, A, R, B, T>(req_route: Route<U>, req_body: Plugin<A, R>, res_body: Plugin<B, T>): Plugin<U & A & B & HasBase, R & T>;
export function rest_post<U, A, R, L, B, T>(req_route: Route<U>, req_body: Plugin<A, R>, res_route?: Route<L> | Plugin<B, T>, res_body?: Plugin<B, T>): Plugin<U & A & B & HasBase, L & R & T> {
    if (typeof res_route == 'function') {
        res_body = res_route as Plugin<B, T>;
        res_route = undefined;
    }
    return mix_plugin(
        method_use(Method.Post),
        origin_from()('base'),
        route_from(req_route)(),
        req_body,
        status_exact(res_route ? Status.Created : res_body ? Status.Ok : Status.NoContent),
        res_route ? route_into(res_route as Route<L>)() : dummy_plugin as Plugin<L, any>,
        res_body || dummy_plugin as Plugin<B, T>
    );
}

export function rest_put<U, A, R>(req_route: Route<U>, req_body: Plugin<A, R>): Plugin<U & A & HasBase, R>;
export function rest_put<U, A, R, B, T>(req_route: Route<U>, req_body: Plugin<A, R>, res_body: Plugin<B, T>): Plugin<U & A & HasBase, R & T>;
export function rest_put<U, A, R, B, T>(req_route: Route<U>, req_body: Plugin<A, R>, res_body?: Plugin<B, T>): Plugin<U & A & B & HasBase, R & T> {
    return mix_plugin(
        method_use(Method.Put),
        origin_from()('base'),
        route_from(req_route)(),
        req_body,
        status_exact(res_body ? Status.Ok : Status.NoContent),
        res_body || dummy_plugin as Plugin<B, T>
    );
}

export function rest_delete<U, A, R>(req_route: Route<U>): Plugin<U & A & HasBase, R>;
export function rest_delete<U, A, R, B, T>(req_route: Route<U>, res_body: Plugin<B, T>): Plugin<U & A & HasBase, R & T>;
export function rest_delete<U, A, R, B, T>(req_route: Route<U>, res_body?: Plugin<B, T>): Plugin<U & A & B & HasBase, R & T> {
    return mix_plugin(
        method_use(Method.Delete),
        origin_from()('base'),
        route_from(req_route)(),
        status_exact(res_body ? Status.Ok : Status.NoContent),
        res_body || dummy_plugin as Plugin<B, T>
    );
}

export function rest_head<U, A, R>(req_route: Route<U>): Plugin<U & A & HasBase, R> {
    return mix_plugin(
        method_use(Method.Head),
        origin_from()('base'),
        route_from(req_route)(),
        status_exact(Status.Found),
    );
}
