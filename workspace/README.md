# Workspace management tool

[![npm version](https://badge.fury.io/js/literium-workspace.svg)](https://badge.fury.io/js/literium-workspace)
[![npm downloads](https://img.shields.io/npm/dm/literium-workspace.svg)](https://www.npmjs.com/package/literium-workspace)
[![Build Status](https://travis-ci.org/katyo/literium.svg?branch=master)](https://travis-ci.org/katyo/literium)

Initially this tool was developed for **Literium** WEB-framework but it also useful to manage any npm packages workspaces.

## Configuration

To manage packages in your project simply add its directories (containing `package.json`) to `"packages": []` in the project root `package.json` as shown below:

```json
{
    "name": "project-name",
    "version": "0.1.0",
    ...
    "devDependencies": {
        "literium-workspace": "^0.2",
        ...
    },
    "packages": [
        "some-package-directory",
        "other-package-directory",
        ...
    ]
}
```

## Usage

Usually the `lws` command-line tool runs from npm scripts,
so we can configure the several useful scripts for our project:

```json
{
    ...
    "scripts": {
        "show": "lws show",
        "install": "lws install",
        "test": "lws test",
        "clean": "lws purge"
    },
    ...
}
```

Now we can run configured scripts using npm:

```shell
kayo@nixie:~/devel/literium$ npm run show

> literium@0.0.0 show /home/kayo/devel/literium
> lws show

literium-base@0.2.5 (base) []
literium-json@0.2.5 (json) [literium-base]
literium-router@0.2.5 (router) [literium-base]
literium-request@0.2.5 (request) [literium-base]
literium@0.2.5 (core) [literium-base]
literium-runner@0.2.5 (runner) [literium-base literium literium-json]
literium-highlight@0.2.5 (highlight) [literium-base literium]
literium-example-todomvc@0.0.3 (examples/todomvc) [literium-base literium literium-json literium-runner]
```

Run `lws` without arguments to get hint about supported commands:

```shell
Usage: workspace <command> <...arguments>
Commands:
  show [package]                Show package(s) info
  install [package]             Install package(s)
  test [package]                Test package(s)
  run <script> [package] [-- <...arguments>]            Run script for package(s)
  purge [package]               Clean package(s) installation
```
