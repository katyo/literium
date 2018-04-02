import { join, resolve, extname } from 'path';
import { open, createReadStream } from 'fs';
import { createServer, Server, IncomingMessage, ServerResponse, request } from 'http';
import { spawn } from 'child_process';

const args = process.argv;
const cmd = args[2];
const port = parseInt(args[3], 10);
let server: Server;

switch (cmd) {
    case 'start':
        console.log('start server on port', port);
        spawn('ts-node', [...args.slice(1, 2), 'run', ...args.slice(3)], {
            detached: true,
            stdio: 'inherit',
        }).unref();
        break;
    case 'run':
        server = createServer(handler);
        server.listen(port);
        break;
    case 'stop':
        console.log('stop server on port', port);
        request({ port, method: 'DELETE' }).end();
        break;
}

const resource_types: { [ext: string]: string } = {
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.eot': 'application/vnd.ms-fontobject',
    '.pdf': 'application/pdf',
    '.map': 'application/octet-stream',
};

const resource_dir = process.env.npm_package_config_output_directory || 'dist';
const resource_path = resolve(resource_dir);

function resource_check(path: string): string | void {
    return resource_types[extname(path)];
}

import { init, hasJs } from 'literium-runner/server';
import { main } from './main';

const render = init();

function notFound(url: string, res: ServerResponse) {
    console.log(`${url} not found!`);
    res.writeHead(404, "Not found");
    res.end("Page not found");
}

function handler(req: IncomingMessage, res: ServerResponse) {
    switch (req.method) {
        case 'GET':
            const url = req.url || '/';
            const resource_type = resource_check(url);
            if (resource_type) {
                const path = resolve(join(resource_dir, url));
                if (path.search(resource_path) == 0) {
                    open(path, 'r', (err, fd) => {
                        if (err) {
                            notFound(url, res);
                        } else {
                            res.writeHead(200, "OK", { 'Content-Type': resource_type as string });
                            createReadStream(path, { fd }).pipe(res);
                        }
                    });
                    return;
                }
            } else {
                render(main(hasJs(req)), html => {
                    res.writeHead(200, "OK", { "Content-Type": "text/html" });
                    res.end(html);
                });
                return;
            }
            break;
        case 'DELETE':
            switch (req.url) {
                case '/':
                    res.end();
                    server.close();
                    process.exit(0);
                    return;
            }
            break;
    }

    notFound(req.url as string, res);
}
