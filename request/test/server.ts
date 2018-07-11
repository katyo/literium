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

function with_body(req: IncomingMessage, cb: (data: Buffer) => void) {
    const bufs: Buffer[] = [];
    req.on('data', buf => {
        bufs.push(buf as Buffer);
    });
    req.on('end', () => {
        cb(Buffer.concat(bufs));
    });
}

function handler(req: IncomingMessage, res: ServerResponse) {
    switch (req.method) {
        case 'GET':
            switch (req.url) {
                case '/xhr/ascii':
                    if (req.headers['accept'] == 'text/plain') {
                        res.writeHead(200, "OK", { "Content-Type": "text/plain" });
                        res.end(Buffer.from("Not very long ASCII text content.", 'ascii'));
                    } else {
                        res.writeHead(400, "Invalid");
                        res.end();
                    }
                    return;
                case '/xhr/utf8':
                    if (req.headers['accept'] == 'text/plain; charset=UTF-8') {
                        res.writeHead(200, "OK", { "Content-Type": "text/plain; charset=UTF-8" });
                        res.end(Buffer.from("Не очень длинное UTF-8 содержимое.", 'utf8'));
                    } else {
                        res.writeHead(400, "Invalid");
                        res.end();
                    }
                    return;
                case '/xhr/binary':
                    if (req.headers['accept'] == 'application/octet-stream') {
                        res.writeHead(200, "OK", { "Content-Type": "application/octet-stream" });
                        res.end(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]));
                    } else {
                        res.writeHead(400, "Invalid");
                        res.end();
                    }
                    return;
                case '/xhr/json':
                    if (req.headers['accept'] == 'application/json') {
                        res.writeHead(200, "OK", { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ a: -1, b: 2, c: [1, 2], d: { a: "b", b: true } }));
                    } else {
                        res.writeHead(400, "Invalid");
                        res.end();
                    }
                    return;
                case '/xhr/error':
                    res.writeHead(403, "Forbidden");
                    res.end();
                    return;
                case '/xhr/download':
                    res.writeHead(200, "OK", {
                        'Content-Type': 'application/octet-stream',
                        'Content-Length': `${1 << 24}`,
                    });
                    res.end(new Array((1 << 24) + 1).join(' ')); // 16Megs of spaces
                    return;
            }
            break;
        case 'PUT':
            switch (req.url) {
                case '/xhr/ascii':
                    with_body(req, body => {
                        if (req.headers['content-type'] == 'text/plain'
                            && body.equals(Buffer.from("Not very long ASCII text content.", 'ascii'))) {
                            res.writeHead(200, "OK");
                        } else {
                            res.writeHead(400, "Invalid");
                        }
                        res.end();
                    });
                    return;
                case '/xhr/utf8':
                    with_body(req, body => {
                        if (req.headers['content-type'] == 'text/plain; charset=UTF-8'
                            && body.equals(Buffer.from("Не очень длинное UTF-8 содержимое.", 'utf8'))) {
                            res.writeHead(200, "OK");
                        } else {
                            res.writeHead(400, "Invalid");
                        }
                        res.end();
                    });
                    return;
                case '/xhr/binary':
                    with_body(req, body => {
                        if (req.headers['content-type'] == 'application/octet-stream'
                            && body.equals(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]))) {
                            res.writeHead(200, "OK");
                        } else {
                            res.writeHead(400, "Invalid");
                        }
                        res.end();
                    });
                    return;
                case '/xhr/json':
                    with_body(req, body => {
                        if (req.headers['content-type'] == 'application/json'
                            && body.equals(Buffer.from(JSON.stringify({ a: -1, b: 2, c: [1, 2], d: { a: "b", b: true } }), 'utf8'))) {
                            res.writeHead(200, "OK");
                        } else {
                            res.writeHead(400, "Invalid");
                        }
                        res.end();
                    });
                    return;
                case '/xhr/error':
                    res.writeHead(502, "Bad gateway");
                    res.end();
                    return;
            }
            break;
        case 'POST':
            switch (req.url) {
                case '/xhr/long':
                    setTimeout(() => {
                        res.writeHead(201, "Created");
                        res.end();
                    }, 2000);
                    return;
                case '/xhr/upload':
                    with_body(req, body => {
                        if (body.length == 1 << 24 && // 16Megs of spaces
                            body.reduce((pre, byte) => pre && byte == 0x20, true)) {
                            res.writeHead(201, "Created");
                        } else {
                            res.writeHead(400, "Invalid");
                        }
                        res.end();
                    });
                    return;
                case '/xhr/break':
                    req.connection.end();
                    return;
            }
            break;
        case 'DELETE':
            switch (req.url) {
                case '/':
                    res.end();
                    server.close();
                    return;
            }
            break;
    }

    res.writeHead(404, "Not found");
    res.end();
}
