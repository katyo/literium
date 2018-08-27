import { Readable, Writable, Duplex } from 'stream';
import { Emit, Result, ok, err, FutureResult } from '@literium/base';

export function data_to_stream(chunk: Buffer): Readable {
    const s = new Duplex();

    s.push(chunk);
    s.push(null);

    return s;
}

export function read_all_from_stream(s: Readable): FutureResult<Buffer, string> {
    s.pause();

    return (emit: Emit<Result<Buffer, string>>) => {
        const chunks: Buffer[] = [];

        s.on('data', chunk => { chunks.push(chunk as Buffer); });
        s.on('end', () => { emit(ok(Buffer.concat(chunks))); });
        s.on('error', error => { emit(err(error.message)); });
        s.resume();

        return () => { s.destroy(); };
    };
}

export function write_all_to_stream(s: Writable): (data: Buffer) => FutureResult<void, string> {
    return (data: Buffer) => {
        return (emit: Emit<Result<void, string>>) => {
            s.once('finish', () => {
                emit(ok(undefined));
            });

            s.once('error', error => {
                emit(err(error.message));
            });

            s.end(data);

            return () => {
                s.destroy();
            };
        };
    };
}
