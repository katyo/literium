import { Option, OkFn, ok, future_ok, map_future, do_seq, some_def, then_some, un_some_else, map_some } from 'literium-base';
import { Component } from 'literium';
import { init } from 'literium-runner/server';
import { StreamBody } from './body';
import { Method, Request, Response, Handler, okay, not_found, with_body } from './http';

export interface RunnerOptions<State, Signal> {
    main(req: Request): Component<State, Signal>;
    post?(state: State): Option<Response>;
    doctype?: string;
    timeout?: number;
}

export function runner_handler<State, Signal>({ main, post, doctype, timeout }: RunnerOptions<State, Signal>): Handler {
    const render = init<State, Signal>(doctype, timeout);

    return req => req.method == Method.Get && req.url ? do_seq(
        render(main(req)),
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
    ) : future_ok(not_found());
}
