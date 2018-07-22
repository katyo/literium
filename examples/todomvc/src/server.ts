import { constant } from 'literium';
import { resource_handler, runner_handler, http_server, handle_all } from 'literium-node';
import { main } from './main';

http_server(handle_all(
    resource_handler(process.env.npm_package_config_output_directory || 'dist'),
    runner_handler({ pre: constant({ store: 'todo' }), main })
));
