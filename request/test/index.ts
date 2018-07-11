import 'setimmediate';

import { strictEqual as se, deepStrictEqual as dse } from 'assert';
import * as is from 'assert';
import { is_ok, un_ok, un_err, err, timeout_future } from 'literium-base';
import * as Json from 'literium-json';
import { Method, Status, StrBody, BinBody, JsonBody, request } from '../src/request';

const base = typeof window != 'undefined' ? '' : 'http://localhost:8182';

describe('request', () => {
    describe('get', () => {
        it('ascii', done => {
            request({
                method: Method.Get,
                url: `${base}/xhr/ascii`,
                headers: { 'accept': 'text/plain' },
                response: StrBody,
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
                response: StrBody
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
                response: BinBody
            })(res => {
                is(is_ok(res));
                const { status, message, headers, body } = un_ok(res);
                se(status, Status.Ok);
                se(message, 'OK');
                se(headers['Content-Type'], 'application/octet-stream');
                dse(body, new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]).buffer);
                done();
            });
        });

        it('json', done => {
            request({
                method: Method.Get,
                url: `${base}/xhr/json`,
                headers: { 'accept': 'application/json' },
                response: JsonBody(Json.dict({
                    a: Json.fin,
                    b: Json.nat,
                    c: Json.list(Json.int),
                    d: Json.dict({
                        a: Json.str,
                        b: Json.bin,
                    })
                }))
            })(res => {
                is(is_ok(res));
                const { status, message, headers, body } = un_ok(res);
                se(status, Status.Ok);
                se(message, 'OK');
                se(headers['Content-Type'], 'application/json');
                dse(body, { a: -1, b: 2, c: [1, 2], d: { a: "b", b: true } });
                done();
            });
        });

        it('json error', done => {
            request({
                method: Method.Get,
                url: `${base}/xhr/json`,
                headers: { 'accept': 'application/json' },
                response: JsonBody(Json.dict({
                    a: Json.fin,
                    b: Json.nat,
                    c: Json.list(Json.str),
                    d: Json.dict({
                        a: Json.str,
                        b: Json.bin,
                    })
                }))
            })(res => {
                is(!is_ok(res));
                dse(un_err(res).message, 'Json parse error: .c [0] !string');
                done();
            });
        });

        it('client error', done => {
            request({
                method: Method.Get,
                url: `${base}/xhr/error`,
                response: StrBody
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
                request: StrBody,
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
                request: StrBody,
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
                request: StrBody,
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
                request: StrBody,
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
                request: BinBody,
                body: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]).buffer
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
                request: BinBody,
                body: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]).buffer
            })(res => {
                is(is_ok(res));
                const { status, message } = un_ok(res);
                se(status, Status.BadRequest);
                se(message, 'Invalid');
                done();
            });
        });

        it('json', done => {
            request({
                method: Method.Put,
                url: `${base}/xhr/json`,
                headers: { 'Content-Type': 'application/json' },
                request: JsonBody(Json.dict({
                    a: Json.fin,
                    b: Json.nat,
                    c: Json.list(Json.int),
                    d: Json.dict({
                        a: Json.str,
                        b: Json.bin,
                    })
                })),
                body: { a: -1, b: 2, c: [1, 2], d: { a: "b", b: true } }
            })(res => {
                is(is_ok(res));
                const { status, message } = un_ok(res);
                se(status, Status.Ok);
                se(message, 'OK');
                done();
            });
        });

        it('json error', done => {
            request({
                method: Method.Put,
                url: `${base}/xhr/json`,
                headers: { 'Content-Type': 'application/json' },
                request: JsonBody(Json.dict({
                    a: Json.fin,
                    b: Json.nat,
                    c: Json.list(Json.int),
                    d: Json.dict({
                        a: Json.str,
                        b: Json.bin,
                    })
                })),
                body: { a: -1, b: 2, c: [3, 4], d: { a: "b", b: true } }
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
                request: StrBody,
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

    it('timeout error', done => {
        const timeout_error = new Error('timeout');
        timeout_future(1000)(err(timeout_error))(request({
            method: Method.Post,
            url: `${base}/xhr/long`,
            request: StrBody,
            body: '',
        }))(res => {
            is(!is_ok(res));
            se(un_err(res), timeout_error);
            done();
        });
    });

    /*
    it('broken error', done => {
        request({
            method: Method.Post,
            url: `${base}/xhr/break`,
            body: '123',
        })(res => {
            is(!is_ok(res));
            se(un_err(res), Error.Broken);
            done();
        });
    });
    */

    describe('progress', function() {
        this.timeout(10000);
        it('upload', done => {
            let all = 0;
            request({
                method: Method.Post,
                url: `${base}/xhr/upload`,
                request: StrBody,
                body: new Array((1 << 24) + 1).join(' '), // 16Megs of spaces
                progress: ({ left, size, down }) => {
                    if (!down) {
                        se(size, 1 << 24);
                        all = left;
                    }
                },
            })(res => {
                is(is_ok(res));
                const { status, message } = un_ok(res);
                se(status, Status.Created);
                se(message, 'Created');
                se(all, 1 << 24);
                done();
            });
        });

        it('download', done => {
            let all = 0;
            request({
                method: Method.Get,
                url: `${base}/xhr/download`,
                response: StrBody,
                progress: ({ left, size, down }) => {
                    if (down) {
                        se(size, 1 << 24);
                        all = left;
                    }
                },
            })(res => {
                is(is_ok(res));
                const { status, message } = un_ok(res);
                se(status, Status.Ok);
                se(message, 'OK');
                se(all, 1 << 24);
                done();
            });
        });
    });
});
