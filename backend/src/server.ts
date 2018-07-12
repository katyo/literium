import { extname } from 'path';
import { Server, createServer, ServerRequest, ServerResponse, request } from 'http';
import { ChildProcess, spawn as spawn_, SpawnOptions } from 'child_process';
import { Handler, handler_to_node } from './http';
import { parse_bind, build_bind } from './bind';
import { do_seq, future_ok, then_future_ok } from 'literium-base';

export function handle_all(handler: Handler<any>, ...handlers: Handler<any>[]): Handler<any> {
    return req => do_seq(
        handler(req),
        then_future_ok(res => res.status == 404 &&
            handlers.length ?
            handle_all(handlers[0], ...handlers.slice(1))(req) :
            future_ok(res))
    );
}

export function http_server(handler: Handler<any>) {
    let server: Server;

    const { argv, env } = process;
    const [cmd, , op] = argv;
    const bind_opts = parse_bind(env.BIND_URI || env.npm_package_config_bind_uri || 'http://:8080');

    switch (op) {
        case 'start':
            console.log('start server on', build_bind(bind_opts));
            spawn(cmd, argv.slice(1).map(arg => arg == 'start' ? 'run' : arg), {
                detached: true,
                stdio: 'inherit',
            }).unref();
            break;
        case 'run':
            server = createServer(server_handler(() => server, handler_to_node(handler)));
            server.listen(bind_opts);
            break;
        case 'stop':
            console.log('stop server on', build_bind(bind_opts));
            const req = request({ ...bind_opts, method: 'DELETE' });
            req.on('error', () => { console.log('not running'); });
            req.on('response', () => { console.log('ok'); });
            req.end();
            break;
    }
}

function server_handler(get_server: () => Server, handler: (req: ServerRequest, res: ServerResponse) => void): (req: ServerRequest, res: ServerResponse) => void {
    return (req: ServerRequest, res: ServerResponse) => {
        if (req.url == '/' && req.method == 'DELETE' &&
            // stopping the server is allowed from localhost only
            req.connection.remoteAddress == req.connection.localAddress) {
            res.end();
            get_server().close();
            process.exit(0);
        } else {
            handler(req, res);
        }
    };
}

function spawn(command: string, args?: ReadonlyArray<string>, options?: SpawnOptions): ChildProcess {
    if (command == 'node' && args && extname(args[0]) == '.ts') {
        command = 'ts-node';
    }
    return spawn_(command, args, options);
}
