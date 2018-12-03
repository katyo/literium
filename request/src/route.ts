import { mk_seq, then_ok, ok_some_or } from '@literium/base';
import { Route, build, match } from '@literium/router';
import { FromArg, IntoRes } from './types';
import { url_from, header_into } from './plugins';

/// Set request url from args using route
///
/// route_from(type)("json")
export function route_from<T>(ty: Route<T>): FromArg<T> {
    return url_from(mk_seq(build(ty), ok_some_or('unable to build route'))) as any;
}

/// Put response location header value into result using route
export function route_into<T>(ty: Route<T>): IntoRes<T> {
    return <R extends T | { [F in K]: T }, K extends keyof R>(field?: K) => header_into(mk_seq(
        ok_some_or('missing location header'),
        then_ok(mk_seq(
            match(ty),
            ok_some_or('unable to match route')
        )),
    ))('location')(field);
}
