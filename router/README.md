# Type-safe router

[![npm version](https://badge.fury.io/js/literium-router.svg)](https://badge.fury.io/js/literium-router)
[![npm downloads](https://img.shields.io/npm/dm/literium-router.svg)](https://www.npmjs.com/package/literium-router)
[![Build Status](https://travis-ci.org/katyo/literium.svg?branch=master)](https://travis-ci.org/katyo/literium)

This project is part of **Literium** WEB-framework but can be used standalone.

## Why

The ordinary routers is not type-safe, so when you change route or corresponding interface you need track compliance between it manually.
The compiler cannot help you in cases of breaking that compliance.

For example, your app may expect arguments which actual router don't provide.
Or viceversa the router may require some arguments which missing in your application.

This leads us to a question: what can we do to make type system to keep the routes and corresponding interfaces in compliance?
Many frameworks in other languages with type inference, like _Haskell_ and _PureScript_, solves this question. So why TypeScript cannot do same too.

## How

Each route have corresponds object with typed fields i.e. arguments.
The routes without arguments corresponds to empty object.
The type of this arguments object is inferred automatically by constructing the route.
You can construct complex routes using simple routing algebra.

## Routing algebra

### Atomic routes

#### Route with static path-piece

In simplest case you can use path string to create routes.

```typescript
import { dir, match, build } from 'literium-router';

const blog = dir('/blog');
// => Route<{}>

match(blog, '/blog')   // => {}
match(blog, '/blog/1') // => undefined
match(blog, '/other')  // => undefined

build(blog, {})        // => '/blog'
build(blog, {id: 1})   // error (extra 'id' property)
```

This route corresponds to path _/blog_ and empty object.

#### Route with argument

When you want handle some data in the path string you can create route with the typed argument.

```typescript
import { num, arg, match, build } from 'literium-router';

const blog_id = arg({id: num});
// => Route<{id: number}>

match(blog_id, '1')       // => {id:1}
match(blog_id, 'other')   // => undefined
match(blog_id, 'blog/1')  // => undefined

build(blog_id, {})        // error (missing 'id' property)
build(blog_id, {id: 1})   // => '1'
```

The argument of `arg()` is the object with property name as key and with property `ArgType<Type>` as a value.

#### Query string arguments

To deal with query string you can use `query()`.

```typescript
import { num, query, match, build } from 'literium-router';

const blog_posts = query({offset: num, length: num});
// => Route<{offset: number, length: number}>

match(blog_posts, '?offset=10&length=5')       // => {offset:10,length:5}
match(blog_posts, '?length=5&offset=10')       // => {offset:10,length:5}
match(blog_posts, '?length=5')                 // => undefined (no length arg)

build(blog_posts, {length:5})                  // error (missing 'offset' property)
build(blog_posts, {offset:10, length:5})       // => '?offset=10&length=5'
```

When you need process different query strings you can alternate queryes using [variants](#variants).

### Route combinators

#### Sequential

To build complex routes you can use `seq()` to sequentially combine sub-routes.

```typescript
import { num, dir, arg, seq, match, build } from 'literium-router';

const blog_by_id = seq(dir('/blog/'), arg({id: num});
// => Route<{id: number}>

match(blog_by_id, '/blog/1')  // => {id:1}
match(blog_by_id, '/blog/1/') // => undefined
match(blog_by_id, '/other')   // => undefined
match(blog_by_id, '1')        // => undefined

build(blog_by_id, {})        // error (missing 'id' property)
build(blog_by_id, {id: 1})   // => '/blog/1'
```

#### Variants

And of course you can combine some number of routes which can be used alternatively.

```typescript
import { str, num, dir, arg, seq, alt, match, build } from 'literium-router';

const blogs_by_tag = seq(dir('/blog/tag-'), arg({id: str}));
// => Route<{id: string}>
const by_author = seq(dir('/author-'), arg({user: num}));
// => Route<{user: number}>

const blogs_by_tag_opt_by_author = seq(blogs_by_tag, alt(by_author, dir('')));
// => Route<{tag: string} | {tag: string} & {user: number}>

match(blogs_by_tag_opt_by_author, '/blog/tag-js')           // => {tag:"js"}
match(blogs_by_tag_opt_by_author, '/blog/tag-js/author-3')  // => {tag:"js",user:3}
match(blogs_by_tag_opt_by_author, '/blog/tag-js/')          // => undefined
match(blogs_by_tag_opt_by_author, '/blog/tag-js/author-')   // => undefined
match(blogs_by_tag_opt_by_author, '/other')                 // => undefined

build(blogs_by_tag_opt_by_author, {})                   // error (missing 'tag' property)
build(blogs_by_tag_opt_by_author, {tag:"git"})          // => '/blog/tag-git'
build(blogs_by_tag_opt_by_author, {user:3})             // error (missing 'tag' property)
build(blogs_by_tag_opt_by_author, {tag:"git",user:3})   // => '/blog/tag-git/author-3'
```

__NOTE:__ Keep in mind the more complex variant must precede simple because in else case the simple routes may become unreachable to match.
This assumption is accepted in order to simplify and speedup route matching algorithm.

### Custom route types

One of the more helpful feature of this router is the possibility to define your own argument types.
For example, suppose we have enum type _Order_ which has two values: _Asc_ and _Desc_. We can simply use it in our routes as arguments when we defined corresponding TypeApi.

```typescript
import { dir, arg, seq, match, build, Route } from 'literium-router';

// Our enum type
export const enum Order { Asc, Desc }

// The implementation of Route
export const ord: Route<Order> = {
    // The parser function (path => value)
    p: path => {
        const m = path.match(/^(asc|desc)(.*)$/);
        if (m) return [m[1] == 'asc' ? Order.Asc : Order.Desc, m[2]];
    },
    // The builder function (value => path)
    b: arg => arg === Order.Asc || arg === Order.Desc ?
        `${arg == Order.Asc ? 'asc' : 'desc'}` : undefined
};

const blogs_by_date = seq(dir('/blog/date-'), arg({sort: ord}));
// => Route<{sort: Order}>

match(blogs_by_date, '/blog/date-asc')    // => {sort:Order.Asc}
match(blogs_by_date, '/blog/date-desc')   // => {sort:Order.Desc}
match(blogs_by_date, '/blog/date-')       // => undefined
match(blogs_by_date, '/blog/date-other')  // => undefined

build(blogs_by_date, {sort:Order.Asc})    // => '/blog/date-asc'
build(blogs_by_date, {sort:Order.Desc})   // => '/blog/date-desc'
build(blogs_by_date, {})                  // error (missing 'sort' property)
build(blogs_by_date, {sort:'asc'})        // error (type mismatch of 'sort' property)
```

### Router

Usually in real-life applications we don't like to operate with routes separately.
One of ways to works with all defined routes together is using of the methods `matchs()` and `builds()`.

This methods gets the object with routes names as keys and routes itself as values.
It operates with the complex state which represents object with routes names as keys and corresponding route arguments objects as values.

```typescript
import { num, str, dir, arg, seq, matchs, builds } from 'literium-router';

const root = dir('/');
const blog_by_id = seq(root, dir('blog/'), arg({id:num}));
const blogs_by_tag = seq(root, dir('blog/tag-'), arg({tag:str}));

const routes = { root, blogs_by_tag, blog_by_id };

matchs(routes, '/')              // => {root:{}}
matchs(routes, '/blog/2')        // => {blog_by_id:{id:2}}
matchs(routes, '/blog/tag-es6')  // => {blogs_by_tag:{tag:"es6"}}

builds(routes, {root:{}})                   // => '/'
builds(routes, {blog_by_id:{id:2}})         // => '/blog/2'
builds(routes, {blogs_by_tag:{tag:"es6"}})  // => '/blog/tag-es6'
```

## TypeScript 2.7 issue

The _TypeScript 2.7.x_ have an [issue](https://github.com/Microsoft/TypeScript/issues/22169) which breaks the type inference of object values, so I strongly recommend to use _TypeScript 2.6.x_ until _TypeScript 2.8.x_ has been released.
