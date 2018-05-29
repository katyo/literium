import { Result, ok, err, then_ok, then_err, map_ok, map_err, and_ok, and_err, unwrap_ok, unwrap_ok_or, unwrap_err, unwrap_err_or, a_ok, b_ok, some_ok, some_err } from './result';
import { Option } from './option';

export type Either<A, B> = { $: 0, _: A; } | { $: 1, _: B };

export const a = err as <A, B>(a: A) => Either<A, B>;
export const b = ok as <A, B>(b: B) => Either<A, B>;
export const then_a = then_err as <A, B, NewA>(fn: (_: A) => Either<NewA, B>) => (_: Either<A, B>) => Either<NewA, B>;
export const then_b = then_ok as <A, B, NewB>(fn: (_: B) => Either<A, NewB>) => (_: Either<A, B>) => Either<A, NewB>;
export const map_a = map_err as <A, NewA>(fn: (_: A) => NewA) => <B>(_: Either<A, B>) => Either<NewA, B>;
export const map_b = map_ok as <B, NewB>(fn: (_: B) => NewB) => <A>(_: Either<A, B>) => Either<A, NewB>;
export const and_a = and_err as <NewA>(a: NewA) => <A, B>(_: Either<A, B>) => Either<NewA, B>;
export const and_b = and_ok as <NewB>(b: NewB) => <A, B>(_: Either<A, B>) => Either<A, NewB>;
export const unwrap_a = unwrap_err as <A, B>(_: Either<A, B>) => A;
export const unwrap_a_or = unwrap_err_or as <A>(_: A) => <B>(_: Either<A, B>) => A;
export const unwrap_b = unwrap_ok as <A, B>(_: Either<A, B>) => B;
export const unwrap_b_or = unwrap_ok_or as <B>(_: B) => <A>(_: Either<A, B>) => B;
export const ok_a = a_ok as <A, B>(_: Either<A, B>) => Result<A, B>;
export const ok_b = b_ok as <A, B>(_: Either<A, B>) => Result<B, A>;
export const some_a = some_err as <A, B>(_: Either<A, B>) => Option<A>;
export const some_b = some_ok as <A, B>(_: Either<A, B>) => Option<B>;
