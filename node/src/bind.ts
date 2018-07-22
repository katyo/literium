import { parse } from 'url';

export interface BindOptions {
    host?: string;
    port?: number;
    path?: string;
    socketPath?: string;
}

export function parse_bind(src: string): BindOptions {
    const { protocol, hostname, port, pathname } = parse(src);

    if (protocol == 'unix:' && hostname && pathname) {
        const path = hostname + pathname;
        return { path, socketPath: path };
    }

    if (port) {
        return { port: +port, host: hostname };
    }

    throw new Error(`Invalid url: ${src}`);
}

export function build_bind({ host, port, path }: BindOptions): string {
    return port ? `http://${host}:${port}` : `unix:${path}`;
}
