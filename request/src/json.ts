import { Type, build, parse } from '@literium/json';
import { FromArg, IntoRes, mix_plugin } from './types';
import { header_use, header_expect, body_from, body_into } from './plugins';

/// Set JSON request body from field of args
///
/// json_from(type)("json")
export function json_from<T>(ty: Type<T>, ct: string = 'application/json'): FromArg<T> {
    return (field?: string) => mix_plugin(
        header_use('content-type', ct),
        body_from()(build(ty))(field)
    );
}

/// Put response JSON body as field into result
export function json_into<T>(ty: Type<T>, ct: string | RegExp = 'json'): IntoRes<T> {
    return (field?: string) => mix_plugin(
        header_expect('content-type', ct),
        body_into()(parse(ty))(field)
    );
}
