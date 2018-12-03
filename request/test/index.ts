import 'setimmediate';

import { deepStrictEqual } from 'assert';
import { Result, ok, err, some, keyed } from '@literium/base';
import * as Json from '@literium/json';
//import * as Router from '@literium/router';
import { Plugin, Error, ErrorKind, Method, Status, StatusKind, BodyType, mix_plugin, request, method_use, origin_use, path_use, path_from, header_use, header_from, header_into, header_exact, header_expect, status_exact, status_expect, status_into, reason_exact, reason_expect, reason_into, body_use, body_exact, body_into, json_from, json_into, progress_emit, ProgressType } from '../src/index';

const base = typeof window != 'undefined' ? '' : 'http://localhost:8182';
const set_origin = origin_use(base);

function test<A, R, XA extends A, XR extends R>(plugin: Plugin<A, R>, arg: XA, res: Result<XR, Error>): (done: () => void) => void {
    return done => {
        request(mix_plugin(set_origin, plugin))
        (arg)((r: Result<R, Error>) => {
            deepStrictEqual(r, res);
            done();
        });
    };
}

const expected_binary_data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]).buffer;

const unexpected_binary_data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]).buffer;

const expected_json_type = Json.dict({
    a: Json.fin,
    b: Json.nat,
    c: Json.list(Json.int),
    d: Json.dict({
        a: Json.str,
        b: Json.bin,
    })
});

const expected_json_data = {
    a: -1,
    b: 2,
    c: [1, 2],
    d: {
        a: "b",
        b: true
    }
};

const unexpected_json_type = Json.dict({
    a: Json.fin,
    b: Json.nat,
    c: Json.list(Json.str),
    d: Json.dict({
        a: Json.str,
        b: Json.bin,
    })
});

const unexpected_json_data = {
    a: -1,
    b: 2,
    c: ["3", "4"],
    d: {
        a: "b",
        b: true
    }
};

type UnexpectedJsonType = Json.JSType<typeof unexpected_json_type>;

// 16Megs of spaces
const too_long_data = new Array((1 << 24) + 1).join(' ');

describe('plugins', () => {
    it('header + path + status_exact + header_exact + body_exact', test(mix_plugin(
        header_use('accept', 'text/plain'),
        path_use('/xhr/ascii'),
        status_exact(Status.Ok),
        header_exact('content-type', 'text/plain'),
        body_exact()("Not very long ASCII text content."),
    ), {}, ok({})));

    it('header_from + path_from + status_expect + header_into + body_into', test(mix_plugin(
        header_from()('accept')('mime'),
        path_from(f => f == 'xhr_ascii' ? ok('/xhr/ascii') : err('unsupported call'))('call'),
        status_expect(StatusKind.Success),
        header_expect('content-type', /text/),
        header_into()('content-type')('mime'),
        body_into()()('text'),
    ), {
        mime: 'text/plain',
        call: 'xhr_ascii',
    }, ok({
        mime: 'text/plain',
        text: "Not very long ASCII text content.",
    })));
});

describe('request', () => {
    describe('get', () => {
        it('ascii', test(mix_plugin(
            path_use('/xhr/ascii'),
            header_use('accept', 'text/plain'),
            status_exact(Status.Ok),
            header_exact('content-type', 'text/plain'),
            body_exact()("Not very long ASCII text content."),
        ), {}, ok({})));

        it('utf8', test(mix_plugin(
            path_use('/xhr/utf8'),
            header_use('accept', 'text/plain; charset=UTF-8'),
            status_exact(Status.Ok),
            header_into()('content-type')('mime'),
            body_into()()("text"),
        ), {}, ok({
            mime: 'text/plain; charset=UTF-8',
            text: "Не очень длинное UTF-8 содержимое.",
        })));

        it('binary', test(mix_plugin(
            method_use(Method.Get),
            path_use('/xhr/binary'),
            header_use('accept', 'application/octet-stream'),
            status_exact(Status.Ok),
            header_exact('content-type', 'application/octet-stream'),
            body_into(BodyType.Binary)()("data"),
        ), {}, ok({
            data: expected_binary_data,
        })));

        it('json', test(mix_plugin(
            path_use('/xhr/json'),
            header_use('accept', 'application/json'),
            status_exact(Status.Ok),
            json_into(expected_json_type)(),
        ), {}, ok(expected_json_data)));

        it('json error', test(mix_plugin(
            path_use('/xhr/json'),
            header_use('accept', 'application/json'),
            status_exact(Status.Ok),
            json_into(unexpected_json_type)(),
        ), {}, err<UnexpectedJsonType, Error>(keyed(ErrorKind.FromBody, 'invalid response body: .c [0] !string'))));

        it('client error', test(mix_plugin(
            path_use('/xhr/error'),
            status_expect(StatusKind.Success),
        ), {}, err(keyed(ErrorKind.FromHead, "invalid status '403' when '2xx' expected"))));
    });

    describe('put', () => {
        it('ascii', test(mix_plugin(
            method_use(Method.Put),
            path_use('/xhr/ascii'),
            header_use('content-type', 'text/plain'),
            body_use()('Not very long ASCII text content.'),
            status_exact(Status.Ok),
        ), {}, ok({})));

        it('ascii error', test(mix_plugin(
            method_use(Method.Put),
            path_use('/xhr/ascii'),
            header_use('content-type', 'text/plain'),
            body_use()('Not very long ASCII text content!'),
            status_exact(Status.Ok),
        ), {}, err(keyed(ErrorKind.FromHead, "unexpected status '400' when '200' expected"))));

        it('utf8', test(mix_plugin(
            method_use(Method.Put),
            path_use('/xhr/utf8'),
            header_use('content-type', 'text/plain; charset=UTF-8'),
            body_use()('Не очень длинное UTF-8 содержимое.'),
            status_exact(Status.Ok),
        ), {}, ok({})));

        it('utf8 error', test(mix_plugin(
            method_use(Method.Put),
            path_use('/xhr/utf8'),
            header_use('content-type', 'text/plain; charset=UTF-8'),
            body_use()('Не очень длинное UTF-8 содержимое!'),
            status_exact(Status.Ok),
        ), {}, err(keyed(ErrorKind.FromHead, "unexpected status '400' when '200' expected"))));

        it('binary', test(mix_plugin(
            method_use(Method.Put),
            path_use('/xhr/binary'),
            header_use('content-type', 'application/octet-stream'),
            body_use(BodyType.Binary)(expected_binary_data),
            status_exact(Status.Ok),
        ), {}, ok({})));

        it('binary error', test(mix_plugin(
            method_use(Method.Put),
            path_use('/xhr/binary'),
            header_use('content-type', 'application/octet-stream'),
            body_use(BodyType.Binary)(unexpected_binary_data),
            status_exact(Status.Ok),
        ), {}, err(keyed(ErrorKind.FromHead, "unexpected status '400' when '200' expected"))));

        it('json', test(mix_plugin(
            method_use(Method.Put),
            path_use('/xhr/json'),
            json_from(expected_json_type)(),
            status_exact(Status.Ok),
        ), expected_json_data, ok({})));

        it('json error', test(mix_plugin(
            method_use(Method.Put),
            path_use('/xhr/json'),
            json_from(unexpected_json_type)(),
            status_exact(Status.Ok),
        ), unexpected_json_data, err(keyed(ErrorKind.FromHead, "unexpected status '400' when '200' expected"))));

        it('server error', test(mix_plugin(
            method_use(Method.Put),
            path_use('/xhr/error'),
            status_into()('status'),
            reason_into()('message')
        ), {}, ok({ status: Status.BadGateway, message: 'Bad gateway' })));
    });

    describe('progress', function() {
        this.timeout(10000);
        
        it('upload', done => {
            let uploaded = 0;
            request(mix_plugin(
                set_origin,
                method_use(Method.Post),
                path_use('/xhr/upload'),
                body_use()(too_long_data),
                progress_emit(ProgressType.Upload)(({ loaded, total }) => {
                    deepStrictEqual(total, some(1 << 24));
                    uploaded = loaded;
                }),
                status_exact(Status.Created),
                reason_expect('Created'),
            ))({})(res => {
                deepStrictEqual(res, ok({}));
                deepStrictEqual(uploaded, 1 << 24);
                done();
            });
        });

        it('download', done => {
            let downloaded = 0;
            request(mix_plugin(
                set_origin,
                path_use('/xhr/download'),
                body_into()()('data'),
                progress_emit(ProgressType.Download)(({ loaded, total }) => {
                    deepStrictEqual(total, some(1 << 24));
                    downloaded = loaded;
                }),
                status_exact(Status.Ok),
                reason_exact('OK'),
            ))({})(res => {
                deepStrictEqual(res, ok({ data: too_long_data }));
                deepStrictEqual(downloaded, 1 << 24);
                done();
            });
        });
    });
});
