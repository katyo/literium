import { resource_handler, http_server, handle_all, okay, not_found, with_body, StreamBody } from 'literium-backend';
import { init } from 'literium-runner/server';
import { main } from './main';
import { do_seq, OkFn, ok, future_ok, map_future } from 'literium';

const render = init();

http_server(handle_all(
    resource_handler(process.env.npm_package_config_output_directory || 'dist'),
    req => req.method == 'GET' && req.url ? do_seq(
        render(main),
        map_future(([html,]) => do_seq(
            okay(),
            with_body(StreamBody, html, 'text/html'),
            ok as OkFn<string>
        ))
    ) : future_ok(not_found())
));
