# Request for Literium web-framework

[![npm version](https://badge.fury.io/js/literium-request.svg)](https://badge.fury.io/js/literium-request)
[![npm downloads](https://img.shields.io/npm/dm/literium-request.svg)](https://www.npmjs.com/package/literium-request)
[![Build Status](https://travis-ci.org/katyo/literium.svg?branch=master)](https://travis-ci.org/katyo/literium)

This project is part of **Literium** WEB-framework but can be used standalone.

## Why not use fetch API

The Literium applications used Fetch API some time ago.
The fetch adds overhead related to promises, but Literium uses own less complex and lightweight alternative to promises which is called futures.
Unlike promises which has two final states (resolved and rejected) the Literium futures has single final (resolved) which can hold either value or error.

## Request API

The API have single function, named `request`, which gets request data and returns future of result with response data as a value and string as an error.

```typescript
function request(req: GenericRequest): Future<Result<GenericResponse, string>>;
```

The simple way to run request shown in the example below:

```typescript
import { is_ok, un_ok } from 'literium-base';
import { request, Method, Status, DataType } from 'literium-request';

request({
    method: Method.Get,
    url: '/some/api/path',
    headers: { accept: 'application/json' }
    response: DataType.String,
})(res => {
    if (is_ok(res)) {
      const { status, message, body } = un_ok(res);
      if (status == 200 &&
          message == 'OK') {
          const data = JSON.parse(body);
          // do something with data
      }
})
```

## Typed requests

There is some correct use-cases for requests.
This package provides corresponding typing rules to check correctness of request construction by **TypeScript** compiler.

For example, you can do `POST` or `PUT` requests with body but you cannot do `GET` or `DELETE` requests with body.

### Requests without body

The simple requests haven't body.

```typescript
interface RequestWithoutBody<TMethod extends Method> {
    method: TMethod;
    url: string;
    headers?: Headers;
    timeout?: number;
    progress?: Send<Progress>;
}
```

The methods of requests without body is: `GET`, `HEAD`, and `DELETE`.

### Requests with body

```typescript
interface RequestWithBody<TMethod extends Method> extends RequestWithoutBody<TMethod> {
    body: GenericBody;
}
```

The methods of requests with body is: `POST`, `PUT`, and `PATCH`.

## Typed responses

### Response body types

To set preferred type of response body use `response` field of request.

```typescript
interface WithResponseBody<TData extends DataType> {
    response: TData;
}
```

You must set response type when you need body contents of response, else you won't be able to read it at all.

### Responses without body

The responses which never have body is: `HEAD`, `DELETE` and `OPTIONS`.

## Common types

### Headers

Currently you can set request headers and get response headers as dictionary with string keys and values:

```typescript
type Headers = Record<string, string>;
```

The types headers system, like that Rust's Hyper provides, is not implemented because it adds extra complexity level.

The available/allowed header names related to user-agent restrictions.

### Body data types

You can send and receive text and binary data in body:

```typescript
const enum DataType {
    String,
    Binary,
}

type GenericBody = string | ArrayBuffer;
```

### Progress events

To receive progress events you may set `progress` field of request.

The progress event looks like below:

```typescript
interface Progress {
    left: number;  // loaded bytes
    size: number;  // total bytes
    down: boolean; // true when downloading, false when uploading
}
```
