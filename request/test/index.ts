import { strictEqual as se, deepStrictEqual as dse } from 'assert';
import * as is from 'assert';
import { is_ok, un_ok } from 'literium-base';
import { Method, Status, DataType, request } from '../'; //'../src/request';

const base = typeof window != 'undefined' ? '' : 'http://localhost:8182';

describe('request', () => {
    describe('get', () => {
        it('ascii', done => {
            request({
                method: Method.Get,
                url: `${base}/xhr/ascii`,
                headers: { 'accept': 'text/plain' },
                response: DataType.String,
            })(res => {
                is(is_ok(res));
                const { status, message, headers, body } = un_ok(res);
                se(status, Status.Ok);
                se(message, 'OK');
                se(headers['Content-Type'], 'text/plain');
                se(body, "Not very long ASCII text content.");
                done();
            });
        });

        it('utf8', done => {
            request({
                method: Method.Get,
                url: `${base}/xhr/utf8`,
                headers: { 'accept': 'text/plain; charset=UTF-8' },
                response: DataType.String
            })(res => {
                is(is_ok(res));
                const { status, message, headers, body } = un_ok(res);
                se(status, Status.Ok);
                se(message, 'OK');
                se(headers['Content-Type'], 'text/plain; charset=UTF-8');
                se(body, "Не очень длинное UTF-8 содержимое.");
                done();
            });
        });

        it('binary', done => {
            request({
                method: Method.Get,
                url: `${base}/xhr/binary`,
                headers: { 'accept': 'application/octet-stream' },
                response: DataType.Binary
            })(res => {
                is(is_ok(res));
                const { status, message, headers, body } = un_ok(res);
                se(status, Status.Ok);
                se(message, 'OK');
                se(headers['Content-Type'], 'application/octet-stream');
                dse(body, new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]).buffer);
                done();
            })
        });

        it('client error', done => {
            request({
                method: Method.Get,
                url: `${base}/xhr/error`,
                response: DataType.String
            })(res => {
                is(is_ok(res));
                const { status, message, body } = un_ok(res);
                se(status, Status.Forbidden);
                se(message, 'Forbidden');
                se(body, '');
                done();
            })
        });
    });

    describe('put', () => {
        it('ascii', done => {
            request({
                method: Method.Put,
                url: `${base}/xhr/ascii`,
                headers: { 'Content-Type': 'text/plain' },
                body: "Not very long ASCII text content."
            })(res => {
                is(is_ok(res));
                const { status, message } = un_ok(res);
                se(status, Status.Ok);
                se(message, 'OK');
                done();
            });
        });

        it('ascii error', done => {
            request({
                method: Method.Put,
                url: `${base}/xhr/ascii`,
                headers: { 'Content-Type': 'text/plain' },
                body: "Not very long ASCII text content!"
            })(res => {
                is(is_ok(res));
                const { status, message } = un_ok(res);
                se(status, Status.BadRequest);
                se(message, 'Invalid');
                done();
            });
        });

        it('utf8', done => {
            request({
                method: Method.Put,
                url: `${base}/xhr/utf8`,
                headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
                body: "Не очень длинное UTF-8 содержимое."
            })(res => {
                is(is_ok(res));
                const { status, message } = un_ok(res);
                se(status, Status.Ok);
                se(message, 'OK');
                done();
            });
        });

        it('utf8 error', done => {
            request({
                method: Method.Put,
                url: `${base}/xhr/utf8`,
                headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
                body: "Не очень длинное UTF-8 содержимое!"
            })(res => {
                is(is_ok(res));
                const { status, message } = un_ok(res);
                se(status, Status.BadRequest);
                se(message, 'Invalid');
                done();
            });
        });

        it('binary', done => {
            request({
                method: Method.Put,
                url: `${base}/xhr/binary`,
                headers: { 'Content-Type': 'application/octet-stream' },
                body: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30])
            })(res => {
                is(is_ok(res));
                const { status, message } = un_ok(res);
                se(status, Status.Ok);
                se(message, 'OK');
                done();
            });
        });

        it('binary error', done => {
            request({
                method: Method.Put,
                url: `${base}/xhr/binary`,
                headers: { 'Content-Type': 'application/octet-stream' },
                body: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31])
            })(res => {
                is(is_ok(res));
                const { status, message } = un_ok(res);
                se(status, Status.BadRequest);
                se(message, 'Invalid');
                done();
            });
        });

        it('server error', done => {
            request({
                method: Method.Put,
                url: `${base}/xhr/error`,
                body: '',
            })(res => {
                is(is_ok(res));
                const { status, message } = un_ok(res);
                se(status, Status.BadGateway);
                se(message, 'Bad gateway');
                done();
            });
        });
    });
});
