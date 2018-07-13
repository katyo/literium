import { resource_handler, http_server, handle_all, okay, not_found, with_body, HtmlBody } from 'literium-backend';
import { init } from 'literium-runner/server';
import { main } from './main';
import { do_seq, OkFn, ok, future_ok, map_future } from 'literium';

const render = init();

http_server(handle_all(
    resource_handler(process.env.npm_package_config_output_directory || 'dist'),
    req => req.method == 'GET' && req.url ? do_seq(
        render(main),
        map_future(([html,]) => {
            return do_seq(
                okay(),
                with_body(HtmlBody, html),
                ok as OkFn<string>
            )
        })
    ) : future_ok(not_found())
));
