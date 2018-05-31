# Literium Web-application framework

[![npm version](https://badge.fury.io/js/literium.svg)](https://badge.fury.io/js/literium)
[![npm downloads](https://img.shields.io/npm/dm/literium.svg)](https://www.npmjs.com/package/literium)
[![Build Status](https://travis-ci.org/katyo/literium.svg?branch=master)](https://travis-ci.org/katyo/literium)

Ultra lightweight client-oriented Web-application framework.

## Architecture

The data flow is similar to Elm-arch and simplified Redux.

### Types

Basic component definition may looks like so:

```typescript
export interface Create<State, Event> {
    (fork: Fork<Event>): State;
}

export interface Update<State, Event> {
    (state: Readonly<State>, event: Event, fork: Fork<Event>): State;
}

export interface Render<State, Event> {
    (state: Readonly<State>, send: Send<Event>): VNodeChild;
}

export interface Component<State, Event> {
    create: Create<State, Event>;
    update: Update<State, Event>;
    render: Render<State, Event>;
}
```

Usually you implement your application as component like shown above which can be turned on using runners from *literium-runner* package.
