import { Option, OkFn, ok, future_ok, map_future, do_seq, some_def, then_some, un_some_else, map_some } from '@literium/base';
import { Component } from '@literium/core';
import { init } from '@literium/runner/server';
import { StreamBody } from './body';
import { Method, Request, Response, Handler, okay, not_implemented, with_body } from './http';

export interface RunnerOptions<Props, State, Signal> {
    pre(req: Request): Props;
    main: Component<Props, State, Signal>;
    post?(state: State): Option<Response>;
    doctype?: string;
    timeout?: number;
}

export function runner_handler<Props, State, Signal>({ pre, main, post, doctype, timeout }: RunnerOptions<Props, State, Signal>): Handler {
    const render = init<Props, State, Signal>(doctype, timeout)(main);

    return req => req.method == Method.Get && req.url ? do_seq(
        render(pre(req)),
        map_future(([html, state]) => do_seq(
            some_def(post),
            then_some(post => post(state)),
            map_some(ok),
            un_some_else(() => do_seq(
                okay(),
                with_body(StreamBody, html, 'text/html'),
                ok as OkFn<string>
            ))
        ))
    ) : future_ok(not_implemented());
}
