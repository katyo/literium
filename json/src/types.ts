import { Result as _Result } from 'literium-base';

export type Result<Type> = _Result<Type, string>;

export interface Type<T> {
    p(v: any): Result<T>; // parse
    b(v: T): Result<any>; // build
}

export interface TypeConv<T, R> {
    (t: Type<T>): Type<R>;
}

export type JSType<J> = J extends Type<infer T> ? T : never;
