import { resource_handler, runner_handler, http_server, handle_all } from '@literium/node';
import { hasJs } from '@literium/runner/server';
import { main } from './main';

http_server(handle_all(
    resource_handler(process.env.npm_package_config_outdir || 'dist'),
    runner_handler({
        main,
        pre: req => ({
            fast: hasJs(req)
        })
    })
));
