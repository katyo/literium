# Literium Web-application runner

[![npm version](https://badge.fury.io/js/literium-runner.svg)](https://badge.fury.io/js/literium-runner)
[![npm downloads](https://img.shields.io/npm/dm/literium-runner.svg)](https://www.npmjs.com/package/literium-runner)
[![Build Status](https://travis-ci.org/katyo/literium.svg?branch=master)](https://travis-ci.org/katyo/literium)

This project is part of **Literium** WEB-framework.

## Usage

The runner includes some independent parts which can be used to run your application.
The application must be implemented as a component.
Same components can be run both on client to interact with user or on server to build HTML pages.

### Component runner

#### Client

```typescript
export interface Run<State, Event> {
    (app: Component<State, Event>, elm?: Node): void;
}

function init<State, Event>(doc: Document = document): Run<State, Event>;
```

The proper way to run your app on client is like so:

```typescript
// import polyfills

// import runner parts (initializer)
import { init } from 'literium-runner/es/client';

// import application component (initializer)
import { main } from './main';

// initialize runner
const run = init();

// initialize app
const app = main();

// run app using runner on whole document (full-page app)
run(app);

// run app using runner on a body node
run(app, document.body);
```

### Additional parts

Depending on your needs you does or doesn't use additional parts.

#### Base URL

The first thing that we would like to determine before application runs is a base URL.

Usually Web-applications available from root of Web-site, so related-links, resources and requests can use the protocol and domain as base URL.

To get base URL you can use `getBase()` as described in examples below.

On client (uses `Location` object of window):

```typescript
import { getBase } from 'literium-runner/es/client';

getBase(window) // => "https://example.tld"
```

On server (uses `Host` header of request):

```typescript
import { getBase } from 'literium-runner/server';

getBase(window) // => "http://example.tld"
```

#### Preferred language

Internationalized applications requires a way to determine preferred language from user environment.

You can get user-preferred languages using `getLangs()` as described below.

On client it tries to determine language from `Navigator`.

```typescript
import { getLangs } from 'literium-runner/es/client';

getLangs(window) // => ['ru', 'en', ...]
```

On server it determines language using `Accept-Language` header of request.

```typescript
import { getLangs } from 'literium-runner/server';

getLangs(request) // => ['ru', 'en', ...]
```

#### Navigation API

Modern user-agents provides advanced History API which allows client-side navigation (also known HTML5 History API).
This allows us speed-up our apps by reducing direct client-server interaction (i.e. from now we won't need requesting html pages itself at all).

Navigation API provided by literium is simple:

```typescript
interface Nav<AppEvent> {
    // change path events handling
    on(fork: Fork<AppEvent>): void;
    // set local path checker
    is(fn: (path: string) => boolean): void;
    // process navigation directly
    go(url: string): void;
    // process click to link event
    ev(evt: Event): void;
}

type SetPath = Keyed<'path', string>; /* change path event */
```

Your application can accept `SetPath` event.

Set navigation event listener using `on()` and local path checker using `is()` on creating your application.

Use `go()` to change current path manually or `ev()` to process clicks on links locally.

Initializing navigation on client:

```typescript
import { initNav } from 'literium-runner/es/client';

const nav = initNav(window); // => Nav<Event extends SetPath>
```

Initializing navigation on server:

```typescript
import { initNav } from 'literium-runner/server';

const nav = initNav(request); // => Nav<Event extends SetPath>
```