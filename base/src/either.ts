import { Result } from './result';

export type Either<A, B> = Result<B, A>;

export {
    ok as b,
    err as a,
    is_ok as is_b,
    is_err as is_a,
    then_ok as then_b,
    then_err as then_a,
    map_ok as map_b,
    map_err as map_a,
    and_ok as and_b,
    or_err as and_a,
    un_ok as un_b,
    un_err as un_a,
    un_ok_or as un_b_or,
    un_err_or as un_a_or,
    un_ok_else as un_b_else,
    un_err_else as un_a_else,
    a_ok as ok_a,
    b_ok as ok_b,
    some_ok as some_b,
    some_err as some_a,
} from './result';
