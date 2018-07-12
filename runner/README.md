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
interface Run<State, Signal> {
    (app: Component<State, Signal>, elm?: Node): void;
}

function init<State, Signal>(doc: Document = document): Run<State, Signal>;
```

The proper way to run your app on client is like so:

```typescript
// import polyfills

// import runner parts (initializer)
import { init } from 'literium-runner/es/client';

// import root application component
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

#### Server

```typescript
interface Run<State, Signal> {
    (app: Component<State, Signal>, end: (html: string) => void): void;
}

function init<State, Signal>(doctype: string = 'html', timeout: number = 1000): Run<State, Signal>
```

The proper way to run your app on client is like so:

```typescript
// import runner parts (initializer)
import { init } from 'literium-runner/server';

// import root application component
import { main } from './main';

// initialize runner
const run = init();

// initialize app
const app = main();

// run app using runner to get html
run(app, (html, state) => {
    // respond with html
    res.writeHead(200, "OK", { "Content-Type": "text/html" });
    res.end(html);
});
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

Navigation API provided by literium consist of several simple parts:

```typescript
// Smart router API
interface RouterApi<Args> {
    // Match path to get arguments
    match(path: string): Option<Args>;
    // Build path using arguments
    build(args: Args): Option<string>;
}

// Route change signal
type SetRoute<Args> = Keyed<'route', Result<[Args, string], string>>;

// Navigation API initializer
export interface NavInit {
    <Args, Signal extends SetRoute<Args>>(router: RouterApi<Args>): NavApi<Signal>;
}

// Smart navigation API
export interface NavApi<Signal> {
    // Initialize navigation api
    create(fork: Fork<Signal>): void;
    // Process direct navigation
    direct(url: string): void;
    // Handle page navigation events
    handle(event: Event): void;
}
```

Your application can accept `SetRoute` signals.

To get HTML5 path change signals you shall create navigation task using `create()` on bootstrapping your application.

Use `direct()` to change current path manually or `handle()` to process clicks on links locally using HTML5 history API.

Initializing navigation on client:

```typescript
import { initNav } from 'literium-runner/es/client';

const nav = initNav(window); // => NavInit

// In main()
const navApi = nav({
    match: router_match(routes),
    build: router_build(routes),
}); // => NavApi<Signal extends SetRoute>
```

Initializing navigation on server:

```typescript
import { initNav } from 'literium-runner/server';

const nav = initNav(request); // => NavInit

// In main()
const navApi = nav({
    match: router_match(routes),
    build: router_build(routes),
}); // => NavApi<Signal extends SetRoute>
```

#### HTTP Status

When your application runs on server it generated HTML pages to provide HTTP responses.
In this case you can make your app able to send an actual HTTP status.

```typescript
import { Status, HasStatus, set_status } from 'literium-runner';

interface State extends HasStatus {
  // ...
}

// initialize status
state = set_status(state, Status.Ok, "OK");

// update status
state = set_status(state, Status.NotFound, "Resource not found");
state = set_status(state, Status.Forbidden, "Access denied");
```

#### Fast responding for JS-aware clients

When your clients is browsers you don't need to bootstrap page on server.

To determine javascript support we can run some js code on client which makes the hint to the server.

This solution uses `js=1` cookie, which sets using simple script like this:

```javascript
var _ = new Date();
_.setTime(_.getTime() + 1e11);
document.cookie = 'js=1;path=/;expires=' + _.toUTCString();
```

To use fast server-side page rendering in your application do that:

```typescript
import { HasJs, hasJsScript } from 'literium-runner';

interface State extends HasJs {
  // ...
}

// check `js` field of state in our application
if (state.js) {
  // do fast bootstrap
} else {
  // do page rendering
}
```

And on server:

```typescript
import { hasJs } from 'literium-server';

// check javascript support cookie
const js = hasJs(request);

// initialize app
main(js);
```
