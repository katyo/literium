# Pretty simple Web-application framework

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT) [![npm version](https://badge.fury.io/js/literium.svg)](https://badge.fury.io/js/literium) [![npm downloads](https://img.shields.io/npm/dm/literium.svg)](https://www.npmjs.com/package/literium) [![Build Status](https://travis-ci.org/katyo/literium.svg?branch=master)](https://travis-ci.org/katyo/literium)

Currently this is an __experimental__ Web-framework built on top of _[snabbdom-ng](https://github.com/katyo/snabbdom/tree/nextgen)_.

The _snabbdom-ng_ is the modified _[snabbdom](https://github.com/snabbdom/snabbdom)_ __Virtual DOM__ library.

## Overview

Literium is a client-side framework for modern Web-application.
Its core principles are explicit state, controllable behavior, declarative code, effeciency, simplicity and flexibility.

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

### Emit\<Signal>

The _emit_ function allows to send events to _component_ in order to modify its state.

```typescript
export interface Emit<Signal> {
    (signal: Signal): void;
}
```

To deal with sub-components you can change the type of `Signal` using `map_emit()` function, like so:

```typescript
import { Emit } from 'literium';

interface SubSignal { }

interface Signal {
  _: SubSignal;
}

const emit: Emit<Signal>;

const sub_emit: Emit<SubSignal> =
  map_emit((sub_signal: SubSignal) => ({ _: sub_signal }))
  (emit);
```

When the `Keyed` container is used to wrap signals you can do it much simpler:

```typescript
import { Keyed, Emit } from 'literium';

interface SubSignal { }

type Signal = Keyed<'sub-signal', SubSignal>;

const emit: Emit<Signal>;

const sub_emit: Emit<SubSignal> = Emit.wrap(emit, 'sub-signal');
```

### Done

The _done_ function allows to notify the host when some asynchronous operation is complete.

```typescript
export interface Done {
    (): void;
}
```

### Fork\<Signal>

The _fork_ function can be used to start some asynchronous operation which may send signals to the component.

```typescript
export interface Fork<Signal> {
    (): [Emit<Signal>, Done];
}
```

You may use it like so:

```typescript
/* start task */
const [emit, done] = fork();

/* emit events */
emit({ $: 'some-signal' });
...
emit({ $: 'other-signal' });

/* end task */
done();
```

This way simplifies asynchronous code handling both on client and server.

To deal with sub-components you can change the type of `Signal` using `map_fork` function, like so:

```typescript
import { Fork } from 'literium';

interface SubSignal { }

interface Signal { _: SubSignal; }

function wrapSubSignal(sub_signal: SubSignal): Signal {
    return { _: sub_signal };
}

const fork: Fork<Signal>;

const sub_fork: Fork<SubSignal> = map_fork(wrapSubSignal)(fork);
```

When the `Keyed` container is used to wrap events you can do it much simpler:

```typescript
import { Keyed, Fork } from 'literium';

interface SubSignal { }

type Signal = Keyed<'sub-signal', SubSignal>;

const fork: Fork<Signal>;

const sub_fork: Fork<SubSignal> = wrap_fork(fork, 'sub-signal');
```

### Create\<State, Signal>

The function _create_ is purposed to get initial state of the component.

```typescript
export interface Create<State, Signal> {
    (fork: Fork<Signal>): State;
}
```

The component can start asynchronous operations on initializing using _fork_.

### Update\<State, Signal>

The function _update_ is purposed to change current state of the component.

```typescript
export interface Update<State, Signal> {
    (state: Readonly<State>, signal: Signal, fork: Fork<Signal>): State;
}
```

Also the component can start asynchronous operations on updating.

### Render\<State, Signal>

The function _render_ is used to render the component in current state.

```typescript
export interface Render<State, Signal> {
    (state: Readonly<State>, emit: Emit<Signal>): VNode;
}
```

## Component\<State, Signal>

By default the components have a state so it must implements all three methods.

```typescript
export interface Component<State, Signal> {
    create: Create<State, Signal>;
    update: Update<State, Signal>;
    render: Render<State, Signal>;
}
```

### Combining

The components may be combined with other components in any reasonable way.
Also you have full control on the state and event handling of the nested components in the parent.
But you must provide right event routing and state changing for the nested components to have expected behavior.
