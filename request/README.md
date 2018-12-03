# Request for Literium web-framework

[![npm version](https://badge.fury.io/js/literium-request.svg)](https://badge.fury.io/js/literium-request)
[![npm downloads](https://img.shields.io/npm/dm/literium-request.svg)](https://www.npmjs.com/package/literium-request)
[![Build Status](https://travis-ci.org/katyo/literium.svg?branch=master)](https://travis-ci.org/katyo/literium)

This project is part of **Literium** WEB-framework but can be used standalone.

## Why not use fetch API

The Literium applications used Fetch API some time ago.
It switched to use its own request module according to that reasons:

* Fetch isn't type-safe and required additional code for type checking and data conversion for each request.
But the *Literium*-framework design promotes declarative way to do that things.

* The fetch adds overhead related to promises.
But Literium uses own less complex and lightweight alternative to promises which is called futures.
Unlike promises which has two final states (resolved and rejected) the Literium futures has single final (resolved) which may hold result which can be either value or error.

## How it works

From the application point of view the request is a some function which gets some data and returns future which resolves with some other data or error.

The input data called arguments, the output data called result. Both of this has types which defined by request.

The requests should be constructed using so called plugins. Each plugin has access to arguments and resulting data and may does something in request processing flow.

If you would like to simply declare and use requests you complettely no need to understand request processing.

## Request API

The API consist of two parts:

* Request API
* Plugins API

The request API consist of single function `request` which gets plugin and returns request function which can be used to make requests. This API depends from the environment: so browser's implementation uses `XMLHttpRequest` and the node's implementations uses `request` function from the `http` module.

The plugins API is platform independent. It includes some built-in plugins and some operations with plugins.

## Mixing plugins

To get custom behavior for defined request you may mix some number of plugins into new plugin.

For example, you can construct REST GET request, which build url using arguments and return JSON body as result.

```
import { Route } from '@literium/route';
import { Type } from '@literium/json';
import { Plugin, mix_plugin, method_use, route_from } from '@literium/request';

function get_json<A, R>(route: Route<A>, json_type: Type<R>): Plugin<A, R> {
    return mix_plugin(
        method_use(Method.Get),
        route_from(req_route)(),
        status_exact(Status.Ok),
        json_into(json_type)(),
    );
}

const my_req = get_json(my_route, my_json_type);

my_req(route_args); // Future<Result<JsonType, Error>>
```
