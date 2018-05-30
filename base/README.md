# Useful core types and functions

[![npm version](https://badge.fury.io/js/literium-base.svg)](https://badge.fury.io/js/literium-base)
[![npm downloads](https://img.shields.io/npm/dm/literium-base.svg)](https://www.npmjs.com/package/literium-base)
[![Build Status](https://travis-ci.org/katyo/literium.svg?branch=master)](https://travis-ci.org/katyo/literium)

This project is part of **Literium** WEB-framework but can be used standalone.

## Types

### Keyed\<Key, Value>

A key-value pair for using as an enumerated (algebraic) type.

```typescript
interface Keyed<Key, Value> { $: Key; _: Value; }
function keyed<Key, Value>($: Key, _: Value): Keyed<Key, Value>;
function to_keyed<Key>($: Key): <Value>(_: Value) => Keyed<Key, Value>;
function map_key<Key, NewKey>(fn: ($: Key) => NewKey): <Value>(_: Keyed<Key, Value>) => Keyed<NewKey, Value>;
function map_value<Value, NewValue>(fn: (_: Value) => NewValue): <Key>(_: Keyed<Key, Value>) => Keyed<Key, NewValue>;
function un_key<Key, Value>(v: Keyed<Key, Value>): Key;
function un_value<Key, Value>(v: Keyed<Key, Value>): Value;
```

### Option\<Value>

An `Option` type makes some value to be optional, i.e. it can hold `some` value or `none`.
This type is preferred to use instead of special values like `null` or `undefined`.

```typescript
type Option<Value> = Some<Value> | None;
function some<Value>(_: Value): Option<Value>;
function none<Value>(): Option<Value>;
function is_some<Value>(o: Option<Value>): o is Some<Value>;
function is_none<Value>(o: Option<Value>): o is None;
function then_some<Value, NewValue>(fn: (_: Value) => Option<NewValue>): (_: Option<Value>) => Option<NewValue>;
function then_none<Value>(fn: () => Option<Value>): (_: Option<Value>) => Option<Value>;
function map_some<Value, NewValue>(fn: (_: Value) => NewValue): (_: Option<Value>) => Option<NewValue>;
function map_none(fn: () => void): <Value>(o: Option<Value>) => Option<Value>;
function and_some<NewValue>(v: NewValue): <Value>(o: Option<Value>) => Option<NewValue>;
function un_some<Value>(opt: Option<Value>): Value;
function un_some_or<Value>(def: Value): (_: Option<Value>) => Value;
function un_some_else<Value>(def: () => Value): (_: Option<Value>) => Value;
function ok_some<Error>(e: Error): <Value>(_: Option<Value>) => Result<Value, Error>;
function err_some<Value>(v: Value): <Error>(_: Option<Error>) => Result<Value, Error>;
function a_some<B>(b: B): <A>(_: Option<A>) => Either<A, B>;
function b_some<A>(a: A): <B>(_: Option<B>) => Either<A, B>;
```

### Result\<Value, Error>

The result can hold resulting value or error.
This type helpful to return from functions or asynchronous operations which may be failed.
This type is preferred than throwing errors or using nullable error-result arguments in NodeJS style callbacks
or using different callbacks in Promise-style.

```typescript
type Result<Value, Error> = Ok<Value> | Err<Error>;
function ok<Value, Error>(val: Value): Result<Value, Error>;
function err<Value, Error>(err: Error): Result<Value, Error>;
function is_ok<Value, Error>(r: Result<Value, Error>): r is Ok<Value>;
function is_err<Value, Error>(r: Result<Value, Error>): r is Err<Error>;
function then_ok<Value, Error, NewValue>(fn: (_: Value) => Result<NewValue, Error>): (res: Result<Value, Error>) => Result<NewValue, Error>;
function then_err<Value, Error, NewError>(fn: (_: Error) => Result<Value, NewError>): (res: Result<Value, Error>) => Result<Value, NewError>;
function map_ok<Value, NewValue>(fn: (_: Value) => NewValue): <Error>(res: Result<Value, Error>) => Result<NewValue, Error>;
function map_err<Error, NewError>(fn: (_: Error) => NewError): <Value>(res: Result<Value, Error>) => Result<Value, NewError>;
function and_ok<NewValue>(v: NewValue): <Value, Error>(res: Result<Value, Error>) => Result<NewValue, Error>;
function or_err<NewError>(e: NewError): <Value, Error>(res: Result<Value, Error>) => Result<Value, NewError>;
function un_ok<Value, Error>(res: Result<Value, Error>): Value;
function un_err<Value, Error>(res: Result<Value, Error>): Error;
function un_ok_or<Value>(def: Value): <Error>(res: Result<Value, Error>) => Value;
function un_err_or<Error>(def: Error): <Value>(res: Result<Value, Error>) => Error;
function un_ok_else<Value, Error>(def: (e: Error) => Value): (res: Result<Value, Error>) => Value;
function un_err_else<Value, Error>(def: (v: Value) => Error): (res: Result<Value, Error>) => Error;
function some_ok<Value, Error>(res: Result<Value, Error>): Option<Value>;
function some_err<Value, Error>(res: Result<Value, Error>): Option<Error>;
function a_ok<A, B>(res: Result<A, B>): Either<A, B>;
function b_ok<A, B>(res: Result<B, A>): Either<A, B>;
```

### Either\<A, B>

The either type is similar to result but preffered for another usecases where both values are success.

```typescript
type Either<A, B> = A<A> | B<B>;
function a<A, B>(a: A): Either<A, B>;
function b<A, B>(b: B): Either<A, B>;
function is_a<A, B>(r: Either<A, B>): r is A<A>;
function is_b<A, B>(r: Either<A, B>): r is B<A>;
function then_a<A, B, NewA>(fn: (_: A) => Either<NewA, B>): (res: Either<A, B>) => Either<NewA, B>;
function then_b<A, B, NewB>(fn: (_: B) => Either<A, NewB>): (res: Either<A, B>) => Either<A, NewB>;
function map_a<A, NewA>(fn: (_: A) => NewA): <B>(res: Either<A, B>) => Either<NewA, B>;
function map_b<B, NewB>(fn: (_: B) => NewB): <A>(res: Either<A, B>) => Either<A, NewB>;
function and_a<NewA>(v: NewA): <A, B>(r: Either<A, B>) => Either<NewA, B>;
function and_b<NewA>(v: NewB): <A, B>(r: Either<A, B>) => Either<A, NewB>;
function un_a<A, B>(r: Either<A, B>): A;
function un_b<A, B>(r: Either<A, B>): B;
function un_a_or<B>(def: A): <B>(r: Either<A, B>) => A;
function un_b_or<A>(def: B): <A>(r: Either<A, B>) => B;
function un_a_else<A, B>(def: (a: A) => B): (res: Either<A, B>) => A;
function un_b_else<A, B>(def: (b: B) => A): (res: Either<A, B>) => B;
function some_a<A, B>(r: Either<A, B>): Option<A>;
function some_b<A, B>(r: Either<A, B>): Option<B>;
function ok_a<A, B>(r: Either<A, B>): Result<B, A>;
function ok_b<A, B>(r: Either<A, B>): Result<A, B>;
```

### Send\<Event>

The method used for sending async events.

```typescript
interface Send<Event> {
    (event: Event): void;
}
function map_send<Event, OtherEvent>(fn: (event: OtherEvent) => Event): (send: Send<Event>) => Send<OtherEvent>;
function keyed_send<Key>(key: Key): <Event>(send: Send<Keyed<Key, Event>>) => Send<Event>;
```

### Fork\<Event>

The method used for starting async tasks.

```typescript
export interface Done {
    (): void;
}
export interface Fork<Event> {
    (): [Send<Event>, Done];
}
function map_fork<Event, OtherEvent>(fn: (event: OtherEvent) => Event): (fork: Fork<Event>) => Fork<OtherEvent>;
function keyed_fork<Key>(key: Key): <OtherEvent>(fork: Fork<Keyed<Key, OtherEvent>>) => Fork<OtherEvent>;
```

## Functions

### Helpers

```typescript
function identity<Value>(_: Value): Value;
function dummy(): void;
function flat_map<Arg, Res>(list: Arg[], fn: (arg: Arg, idx: number) => Res | Res[]): Res[];
function flat_list<Type>(list: (Type | Type[])[]): Type[];
function flat_all<Type>(...args: (Type | Type[])[]): Type[];
```
