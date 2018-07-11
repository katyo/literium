import { BodyType, DataType } from './types';
import { map_err, mk_seq } from 'literium-base';
import * as Json from 'literium-json';

export function JsonBody<T>(t: Json.Type<T>): BodyType<T, DataType.String> {
    return {
        t: DataType.String,
        p: mk_seq(Json.parse(t), map_err(msg => new Error(`Json parse error: ${msg}`))),
        b: mk_seq(Json.build(t), map_err(msg => new Error(`Json build error: ${msg}`))),
    };
}
