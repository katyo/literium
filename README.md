# Pretty simple Web-application framework

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT) [![npm version](https://badge.fury.io/js/literium.svg)](https://badge.fury.io/js/literium) [![npm downloads](https://img.shields.io/npm/dm/literium.svg)](https://www.npmjs.com/package/literium) [![Build Status](https://travis-ci.org/katyo/literium.svg?branch=master)](https://travis-ci.org/katyo/literium)

Currently this is an __experimental__ Web-framework built on top of _[snabbdom-ng](https://github.com/katyo/snabbdom/tree/nextgen)_.

The _snabbdom-ng_ is the modified _[snabbdom](https://github.com/snabbdom/snabbdom)_ __Virtual DOM__ library.

## Features

* Browser interaction (Client-side)
* Dynamic HTML generation (Server-side)
* Static HTML pre-rendering
* Preferred to live at top-level (i.e. root `<html>`-node or `document.documentElement`)

## Architecture

The _component_ is a part of _application_ which lives and can be used independently from it.
So the _application_ itself is a root _component_ which lives at top-level.

The _state_ and _event_ is a main objects which application operates with using some set of operations.
The _state_ object uniquely determines current state of the _component_ or _application_.
The _event_ objects is used to modify the state of the _component_ or _application_.

## Functions

### Send\<Event>

The _send_ function allows to send events to _component_ in order to modify its state.

```typescript
export interface Send<Event> {
    (event: Event): void;
}
```

To deal with sub-components you can change the type of `Event` using `send_map` function, like so:

```typescript
import { Send, send_map } from 'literium';

interface SubEvent { }

interface Event { _: SubEvent; }

const send: Send<Event>;

const sub_send: Send<SubEvent> = send_map(send, (sub_event: SubEvent) => ({ _: sub_event }));
```

### Done

The _done_ function allows to notify the host when some asynchronous operation is complete.

```typescript
export interface Done {
    (): void;
}
```

### Fork\<Event>

The _fork_ function can be used to start some asynchronous operation which may send events to the component.

```typescript
export interface Fork<Event> {
    (): [Send<Event>, Done];
}
```

You may use it like so:

```typescript
/* start task */
const [send, done] = fork();

/* send event */
send({ $: 'my-event' });

/* end task */
done();
```

This way simplifies asynchronous code handling both on client and server.

To deal with sub-components you can change the type of `Event` using `fork_map` function, like so:

```typescript
import { Fork, fork_map } from 'literium';

interface SubEvent { }

interface Event { _: SubEvent; }

function wrapSubEvent(sub_event: SubEvent): Event {
    return { _: sub_event };
}

const fork: Fork<Event>;

const sub_send: Fork<SubEvent> = fork_map(fork, wrapSubEvent);
```

### Create\<State, Event>

The function _create_ is purposed to get initial state of the component.

```typescript
export interface Create<State, Event> {
    (fork: Fork<Event>): State;
}
```

The component can start asynchronous operations on initializing using _fork_.

### Update\<State, Event>

The function _update_ is purposed to change current state of the component.

```typescript
export interface Update<State, Event> {
    (state: Readonly<State>, event: Event, fork: Fork<Event>): State;
}
```

Also the component can start asynchronous operations on updating.

### Render\<State, Event>

The function _render_ is used to render the component in current state.

```typescript
export interface Render<State, Event> {
    (state: Readonly<State>, send: Send<Event>): VNode;
}
```

## Component\<State, Event>

By default the components have a state so it must implements all three methods.

```typescript
export interface Component<State, Event> {
    create: Create<State, Event>;
    update: Update<State, Event>;
    render: Render<State, Event>;
}
```

### Combining

The components may be combined with other components in any reasonable way.
Also you have full control on the state and event handling of the nested components in the parent.
But you must provide right event routing and state changing for the nested components to have expected behavior.
