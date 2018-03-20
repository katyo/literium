import { Result, result_ok, result_err, result_map, result_map_err, result_unwrap, result_unwrap_or, result_unwrap_err, result_unwrap_err_or } from './result';

export type Either<A, B> = { $: 0, _: A; } | { $: 1, _: B };

export const either_a = result_err as <A, B>(a: A) => Either<A, B>;
export const either_b = result_ok as <A, B>(b: B) => Either<A, B>;
export const either_map_a = result_map_err as <A, B, NewA>(fn: (_: A) => NewA) => (_: Either<A, B>) => Either<NewA, B>;
export const either_map_b = result_map as <A, B, NewB>(fn: (_: B) => NewB) => (_: Either<A, B>) => Either<A, NewB>;
export const either_unwrap_a = result_unwrap_err as <A, B>(_: Either<A, B>) => A;
export const either_unwrap_a_or = result_unwrap_err_or as <A>(_: A) => <B>(_: Either<A, B>) => A;
export const either_unwrap_b = result_unwrap as <A, B>(_: Either<A, B>) => B;
export const either_unwrap_b_or = result_unwrap_or as <B>(_: B) => <A>(_: Either<A, B>) => B;
export const either_result = <A, B>(_: Either<A, B>) => _ as Result<B, A>;
