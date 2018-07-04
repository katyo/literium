# Type-safe JSON parsing/formatting

[![npm version](https://badge.fury.io/js/literium-json.svg)](https://badge.fury.io/js/literium-json)
[![npm downloads](https://img.shields.io/npm/dm/literium-json.svg)](https://www.npmjs.com/package/literium-json)
[![Build Status](https://travis-ci.org/katyo/literium.svg?branch=master)](https://travis-ci.org/katyo/literium)

This project is part of **Literium** WEB-framework but can be used standalone.

## Why

Usually in JavaScript we use functions like `JSON.parse()` and `JSON.stringify()` to exchange datas between application and world.
This way is quite simple but haven't allows to prevent expensive runtime errors related to inconsistency between data and model.

To solve this problem historically used three approaches:
* Validating data consistency manually
* Validating data using predefined schema
* Using parser combinators to get a valid data

The first approach needs too many hand-written code for complex models and suggested to use for simple checks only.
The second approach is powerful and preferred to use for validating complex models but not so convenient for applying within statically-typed languages.
The third approach is used in libraries like [serde](https://serde.rs/) (Rust) and [Aeson](http://hackage.haskell.org/package/aeson) (Haskell) and so powerful as second but also works fine with automatic type inherence.

## How

Each data type have corresponded `JsonType` interface which implements parser and builder.
The parser gets untyped data do internal validation and returns `JsonResult` which is either the data of corresponded type or an error string.
The builder gets typed data and like the parser after some checks returns `JsonResult` which is either the untyped data or an error string.

## API basics

The proposed API have two class of functions: the first works with string JSON representation, the second operates with untyped JS data (i.e. with `any` type).

```typescript
import { JsonType, build, parse, build_js, parse_js } from 'literium-json';

const json_model: JsonType<JSType>;

build(json_model)(/*js-data*/)     // => Result<"json-string", "error-string">
build_js(json_model)(/*js-data*/)  // => Result<js-data, "error-string">

parse(json_model)("json-data")     // => Result<js-data, "error-string">
parse_js(json_model)(/*js-data*/)  // => Result<js-data, "error-string">
```

## Model algebra

### Atomic types

#### Basic types

There are some basic atomic types corresponded to JSON data model:

* `str` - JSON *string*
* `num` - JSON *number*
* `bin` - JSON *boolean*
* `und` - JSON *null*

```typescript
import { str, num, build, parse } from 'literium-json';

parse(str)(`"abc"`) // => ok("abc")
parse(str)(`123`)   // => err("!string")

parse(num)(`123`)   // => ok(123)
parse(num)(`"abc"`) // => err("!number")

build(str)("abc")   // => ok(`"abc"`)
build(str)(123 as any)   // => err("!string")

build(num)(123)     // => ok(`123`)
build(num)("abc" as any) // => err("!number")
```

#### Numeric types

The set of useful numeric types allows you to get more strict numbers validation:

* `fin` - finite numbers
* `pos` - positive numbers
* `neg` - negative numbers
* `int` - integer numbers
* `nat` - natural numbers

```typescript
import { nat, build, parse } from 'literium-json';

parse(nat)(`123`)   // => ok(123)
parse(nat)(`-123`)  // => err("negative")
parse(nat)(`12.3`)  // => err("!integer")
parse(nat)(`"abc"`) // => err("!number")

build(nat)(123)     // => ok(`123`)
build(nat)(-123)    // => err("negative")
build(nat)(12.3)    // => err("!integer")
```

### Container types

#### List combinator

The `list` container corresponds to JSON *array* type.

```typescript
import { str, list, parse, build } from 'literium-json';

const args = list(str);
// => JsonType<string[]>

parse(args)(`["arg1","arg2","arg3"]`)
// => ok(["arg1", "arg2", "arg3"])
parse(args)(`[]`)    // => ok([])
parse(args)(`{}`)    // => err("!array")
parse(args)(`"arg"`) // => err("!array")

build(args)(["arg1", "arg2", "arg3"])
// => ok(`["arg1","arg2","arg3"]`)
build(args)({} as any)    // => err("!array")
build(args)("arg" as any) // => err("!array")
```

#### Dictionary combinator

The `dict` container corresponds to JSON *object* type.

```typescript
import { str, num, dict, parse, build } from 'literium-json';

const opts = dict({ a: str, b: num });
// => JsonType<{ a: string, b: number }>

parse(opts)(`{"a":"abc","b":123}`)
// => ok({a:"abc",b:123})
parse(opts)(`["a","b"]`)   // => err("!object")
parse(opts)(`{}`)          // => err(".a missing")
parse(opts)(`{"a":123}`)   // => err(".a !string")
parse(opts)(`{"a":"abc"}`) // => err(".b missing")

build(opts)({a:"abc",b:123})
// => ok(`{"a":"abc","b":123}`)
build(opts)("a" as any)     // => err("!object")
build(opts)({} as any)      // => err(".a missing")
build(opts)({a:123} as any)   // => err(".a !string")
build(opts)({a:"abc"} as any) // => err(".b missing")
```

#### Tuple combinator

In some cases we prefer to use tuples instead of dictionaries.

```typescript
import { str, num, tup, parse, build } from 'literium-json';

const args = tup(str, num);
// => JsonType<[string, number]>

parse(args)(`["abc",123]`)         // => ok(["abc", 123])
parse(args)(`{"a":"abc","b":123}`) // => err("!tuple")
parse(args)(`["abc"]`)             // => err("insufficient")
parse(args)(`["abc",123,true]`)    // => err("exceeded")
parse(args)(`[123,"abc"]`)         // => err("[0] !string")
parse(args)(`["abc",null]`)        // => err("[1] !number")

build(args)(["abc", 123])          // => ok(`["abc", 123]`)
build(args)("a" as any)            // => err("!tuple")
build(args)([] as any)             // => err("insufficient")
build(args)([1,2,3] as any)        // => err("exceeded")
build(args)([123, "abc"] as any)   // => err("[0] !string")
build(args)(["abc",false] as any)  // => err("[1] !number")
```

### Type modifiers

#### Alternatives

Of course you can combine some number of types which can be used alternatively.

```typescript
import { num, str, alt, parse, build } from 'literium-json';

const son = alt(str, num);

parse(son)(`"abc"`)    // => ok("abc")
parse(son)(`123`)      // => ok(123)
parse(son)(`true`)     // => err("!string & !number")
parse(son)(`[]`)       // => err("!string & !number")

build(son)("abc")       // => ok(`"abc"`)
build(son)(123)         // => ok(`123`)
build(son)(true as any) // => err("!string & !number")
build(son)([] as any)   // => err("!string & !number")
```

#### Optional

The `opt()` is useful for defining an optional values in model.

```typescript
import { str, opt, parse, build } from 'literium-json';

const so = opt(str);

parse(so)(`"abc"`)    // => ok("abc")
parse(so)(`123`)      // => err("!string & defined")
parse(so)(`true`)     // => err("!string & defined")
parse(so)(`[]`)       // => err("!string & defined")

build(so)("abc")       // => ok(`"abc"`)
build(so)(123 as any)  // => err("!string & defined")
build(so)(true as any) // => err("!string & defined")
build(so)([] as any)   // => err("!string & defined")
```

#### Defaults

Also you can add the optional values with default values using `def()`.

```typescript
import { str, def, parse, build } from 'literium-json';

const sd = def(str, "def");

parse(sd)(`"abc"`)    // => ok("abc")
parse(sd)(`null`)     // => ok("def")
parse(sd)(`123`)      // => err("!string & defined")
parse(sd)(`[]`)       // => err("!string & defined")

build(sd)("abc")       // => ok(`"abc"`)
build(sd)("def")       // => ok(`null`)
build(sd)(123 as any)  // => err("!string")
build(sd)([] as any)   // => err("!string")
```

#### Constant

Use `val()` to add some constant value into model.

```typescript
import { str, val, dict, parse, build } from 'literium-json';

const d = dict({
    a: str,
    b: val(123),
});

parse(d)(`{"a":"abc"}`)          // => ok({a:"abc",b:123})
parse(d)(`{"a":"abc","b":456}`)  // => ok({a:"abc",b:123})
parse(d)(`{}`)                   // => err(".a missing")

build(d)({a:"abc"})              // => ok(`{"a":"abc"}`)
build(d)({a:"abc",b:123})        // => ok(`{"a":"abc"}`)
build(d)({})                     // => err(".a missing")
```

#### Value mapping

In some cases you need simply to change the type of value or modify value but you would like to avoid implementing new parser. You can use mapping like bellow:

```typescript
import { int, map, parse, build } from 'literium-json';

const start_from_one = map(
  (v: number) => v + 1,
  (v: number) => v - 1
);
const idx = start_from_one(int);

parse(idx)(`0`) // => ok(1)
parse(idx)(`9`) // => ok(10)

build(idx)(1)   // => ok(`0`)
build(idx)(10)  // => ok(`9`)
```

#### Advanced validation

In some advanced cases you need apply some extra validation to already parsed values. You can do it with `then()` like so:

```typescript
import { ok, err } from 'literium';
import { int, then, parse, build } from 'literium-json';

const validate_even = then(
  (v: number) => v % 2 ? err('odd') : ok(v),
  (v: number) => v % 2 ? err('odd') : ok(v),
);
const even = validate_even(int);

parse(even)(`0`) // => ok(0)
parse(even)(`9`) // => err('odd')

build(even)(0)   // => ok(`0`)
build(even)(9)   // => err('odd')
```

### User-defined types and combinators

#### Custom type

One of the more helpful feature of this library is the possibility to define your own data types with fully customized validation.
For example, suppose we have enum type _Order_ which has two values: _Asc_ and _Desc_. We can simply use it in our data models when we defined corresponding JsonType for it.

```typescript
import { ok, err } from 'literium';
import { str, parse, build, JsonType } from 'literium-json';

// Our enum type
export const enum Order { Asc, Desc }

// The implementation of TypeApi
export const ord: JsonType<Order> = {
    // The parser function
    p(v) {
        const s = str.p(v);
        return !s.$ ? err(s._) : s._ == 'asc' ? ok(Order.Asc) : s._ == 'desc' ? ok(Order.Desc) : err("!'asc' & !'desc'");
    },
    // The builder function
    b(v) {
        return v === Order.Asc ? ok('asc') : v === Order.Desc ? ok('desc') : err("!Order");
    },
};

parse(ord)(`"asc"`)    // => ok(Order.Asc)
parse(ord)(`"desc"`)   // => ok(Order.Desc)
parse(ord)(`"abc"`)    // => err("!'asc' & !'desc'")
parse(ord)(`123`)      // => err("!string")

build(ord)(Order.Asc)  // => ok("asc")
build(ord)(Order.Desc) // => ok("desc")
build(ord)(123)        // => err("!Order")
build(ord)("abc")      // => err("!Order")
```

#### Custom combinator

The example below demonstrates how to create custom combinator.

```typescript
import { ok, err } from 'literium';
import { str, num, parse, build, JsonType } from 'literium-json';

export interface Pair<Key, Value> { $: Key, _: Value }

export function pair<Key, Value>(
  tk: JsonType<Key>,
  tv: JsonType<Value>
): JsonType<Pair<Key, Value>> {
    return {
        p(x) {
            if (typeof x != 'object' ||
                Array.isArray(x) ||
                x == null) return err('!pair');
            const k = tk.p(x.$);
            if (!k.$) return err(`#key ${k._}`);
            const v = tv.p(x._);
            if (!v.$) return err(`#value ${v._}`);
            return ok({$: k._, _: v._});
        },
        b(x) {
            if (typeof x != 'object' ||
                Array.isArray(x) ||
                x == null) return err('!pair');
            const k = tk.b(x.$);
            if (!k.$) return err(`#key ${k._}`);
            const v = tv.b(x._);
            if (!v.$) return err(`#value ${v._}`);
            return ok({$: k._, _: v._});
        }
    };
}

const snp = pair(str, num);

parse(snp)(`{"$":"abc","_":123}`)  // => ok({$:"abc",_:123})
parse(snp)(`["abc",123]`)          // => err("!pair")
parse(snp)(`null`)                 // => err("!pair")
parse(snp)(`{"_":123}`)            // => err("#key !string")
parse(snp)(`{"$":123}`)            // => err("#key !string")
parse(snp)(`{"$":"abc","_":true}`) // => err("#value !number")

build(snp)({$: "abc", _: 123})     // => ok(`{"$":"abc","_":123}`)
build(snp)(["abc",123] as any)     // => err("!pair")
build(snp)(null as any)            // => err("!pair")
build(snp)({_: 123})               // => err("#key !string")
build(snp)({$: 123})               // => err("#key !string")
build(snp)({$: "abc", _: true})    // => err("#value !number")
```
