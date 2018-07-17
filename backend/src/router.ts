import { Method, Request, Handler, FutureResponse, not_found } from './http';
import { Routes, match_paired } from 'literium-router';
import { future_ok } from 'literium-base';

export interface RoutedRequest<Args> extends Request {
    args: Args;
}

export interface RoutedHandler<Args> {
    (req: RoutedRequest<Args>): FutureResponse;
}

export type RoutedHandlers<State> = { [RKey in keyof State]: { [MKey in Method]?: RoutedHandler<State[RKey]> } };

export function routed_handler<State>(routes: Routes<State>, handlers: RoutedHandlers<State>): Handler {
    const router_match = match_paired(routes);
    return (req: Request) => {
        const state = router_match(req.url);
        if (state.$) {
            for (const name in state._) {
                const args = state._[name];
                const handler = handlers[name][req.method];
                if (handler) {
                    return handler(<RoutedRequest<typeof args>>{
                        ...req,
                        args,
                    });
                }
            }
        }
        return future_ok(not_found());
    };
}
