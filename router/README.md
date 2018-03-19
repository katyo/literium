# Type-safe router for Literium web-framework

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

### String route

In simplest case you can use path string to create routes.

```typescript
import { route_str, route_match, route_build } from 'literium-router';

const blog = route_str('/blog');
// => Route<{}>

route_match(blog, '/blog')   // => {}
route_match(blog, '/blog/1') // => undefined
route_match(blog, '/other')  // => undefined

route_build(blog, {})        // => '/blog'
route_build(blog, {id: 1})   // error (extra 'id' property)
```

This route corresponds to path _/blog_ and empty object.

### Route with argument

When you want handle some data in the path string you can create route with the typed argument.

```typescript
import { route_arg, route_match, route_build, baseTypes } from 'literium-router';

const blog_id = route_arg({id: 'num'}, baseTypes);
// => Route<{id: number}>

route_match(blog_id, '1')       // => {id:1}
route_match(blog_id, 'other')   // => undefined
route_match(blog_id, 'blog/1')  // => undefined

route_build(blog_id, {})        // error (missing 'id' property)
route_build(blog_id, {id: 1})   // => '1'
```

The first argument of `route_arg()` is the object with property name as key and with property type-tag as value.
The available type-tags and corresponding value types is defined by the second argument of `route_arg()`.

### Complex routes

To build complex routes you can use `route_and()` to sequentially combine sub-routes.

```typescript
import { route_str, route_arg, route_and, route_match, route_build, baseTypes } from 'literium-router';

const blog_by_id = route_and(route_str('/blog/'), route_arg({id: 'num'}, baseTypes);
// => Route<{id: number}>

route_match(blog_by_id, '/blog/1')  // => {id:1}
route_match(blog_by_id, '/blog/1/') // => undefined
route_match(blog_by_id, '/other')   // => undefined
route_match(blog_by_id, '1')        // => undefined

route_build(blog_by_id, {})        // error (missing 'id' property)
route_build(blog_by_id, {id: 1})   // => '/blog/1'
```

### Route variants

And of course you can combine some number of routes which can be used alternatively.

```typescript
import { route_str, route_arg, route_and, route_match, route_build, baseTypes } from 'literium-router';

const blogs_by_tag = route_and(route_str('/blog/tag-'), route_arg(baseTypes, {id: 'str'}));
// => Route<{id: string}>
const by_author = route_and(route_str('/author-'), route_arg(baseTypes, {user: 'num'}));
// => Route<{user: number}>

const blogs_by_tag_opt_by_author = route_and(blogs_by_tag, route_or(by_author, route_str('')));
// => Route<{tag: string} | {tag: string} & {user: number}>

route_match(blogs_by_tag_opt_by_author, '/blog/tag-js')           // => {tag:"js"}
route_match(blogs_by_tag_opt_by_author, '/blog/tag-js/author-3')  // => {tag:"js",user:3}
route_match(blogs_by_tag_opt_by_author, '/blog/tag-js/')          // => undefined
route_match(blogs_by_tag_opt_by_author, '/blog/tag-js/author-')   // => undefined
route_match(blogs_by_tag_opt_by_author, '/other')                 // => undefined

route_build(blogs_by_tag_opt_by_author, {})                   // error (missing 'tag' property)
route_build(blogs_by_tag_opt_by_author, {tag:"git"})          // => '/blog/tag-git'
route_build(blogs_by_tag_opt_by_author, {user:3})             // error (missing 'tag' property)
route_build(blogs_by_tag_opt_by_author, {tag:"git",user:3})   // => '/blog/tag-git/author-3'
```

__NOTE:__ Keep in mind the more complex variant must precede simple because in else case the simple routes may become unreachable to match.
This assumption is accepted in order to simplify and speedup route matching algorithm.

### Argument types

One of the more helpful feature of this router is the possibility to define your own argument types.
For example, suppose we have enum type _Order_ which has two values: _Asc_ and _Desc_. We can simply use it in our routes as arguments when we defined corresponding TypeApi.

```typescript
import { route_str, route_arg, route_and, route_match, route_build, TypeApi } from 'literium-router';

// Our enum type
export const enum Order { Asc, Desc }

// The type-tag to type mapping
export interface OrderType {
    ord: Order;
}

// The implementation of TypeApi
export const orderType: TypeApi<OrderType> = {
    ord: {
        // The parser function (path => value)
        parse: path => {
            const m = path.match(/^(asc|desc)(.*)$/);
            if (m) return [m[1] == 'asc' ? Order.Asc : Order.Desc, m[2]];
        },
        // The builder function (value => path)
        build: arg => arg === Order.Asc || arg === Order.Desc ?
            `${arg == Order.Asc ? 'asc' : 'desc'}` : undefined
    },
};

const blogs_by_date = route_and(route_str('/blog/date-'), route_arg(orderType, {sort: 'ord'}));
// => Route<{sort: Order}>

route_match(blogs_by_date, '/blog/date-asc')    // => {sort:Order.Asc}
route_match(blogs_by_date, '/blog/date-desc')   // => {sort:Order.Desc}
route_match(blogs_by_date, '/blog/date-')       // => undefined
route_match(blogs_by_date, '/blog/date-other')  // => undefined

route_build(blogs_by_date, {sort:Order.Asc})    // => '/blog/date-asc'
route_build(blogs_by_date, {sort:Order.Desc})   // => '/blog/date-desc'
route_build(blogs_by_date, {})                  // error (missing 'sort' property)
route_build(blogs_by_date, {sort:'asc'})        // error (type mismatch of 'sort' property)
```

### Router

Usually in real-life applications we don't like to operate with routes separately.
One of ways to works with all defined routes together is using of the methods `router_match()` and `router_build()`.

This methods gets the object with routes names as keys and routes itself as values.
It operates with the complex state which represents object with routes names as keys and corresponding route arguments objects as values.

```typescript
import { route_str, route_arg, route_and, router_match, router_build, baseTypes } from 'literium-router';

const root = route_str('/');
const blog_by_id = route_and(root, route_str('blog/'), route_arg({id:'num'}, baseTypes));
const blogs_by_tag = route_and(root, route_str('blog/tag-'), route_arg({tag:'str'}, baseTypes));

const routes = { root, blogs_by_tag, blog_by_id };

router_match(routes, '/')              // => {root:{}}
router_match(routes, '/blog/2')        // => {blog_by_id:{id:2}}
router_match(routes, '/blog/tag-es6')  // => {blogs_by_tag:{tag:"es6"}}

router_build(routes, {root:{}})                   // => '/'
router_build(routes, {blog_by_id:{id:2}})         // => '/blog/2'
router_build(routes, {blogs_by_tag:{tag:"es6"}})  // => '/blog/tag-es6'
```

## TypeScript 2.7 issue

The _TypeScript 2.7.x_ have an [issue](https://github.com/Microsoft/TypeScript/issues/22169) which breaks the type inference of object values, so I strongly recommend to use _TypeScript 2.6.x_ until _TypeScript 2.8.x_ has been released.

## Todo

* Handling search parameters
