import { dsef } from './test';
import {
    future_ok, future_err,
    then_future_ok, then_future_err,
    map_future_ok, map_future_err,

    ok, err,
} from '../src/index';

describe('future result', () => {
    it('future async ok', done => {
        dsef(future_ok(123), ok(123), done);
    });

    it('future async err', done => {
        dsef(future_err('unknown'), err('unknown'), done);
    });

    describe('then_future_ok', () => {
        it('case 1', done => {
            dsef(then_future_ok((v: string) => future_ok(`then ${v}`))(future_ok('abc')), ok('then abc'), done);
        });
        it('case 2', done => {
            dsef(then_future_ok((v: string) => future_ok(`then ${v}`))(future_err(false)), err(false), done);
        });
        it('case 3', done => {
            dsef(then_future_ok((v: string) => future_err(v.length > 0))(future_ok('abc')), err(true), done);
        });
        it('case 1', done => {
            dsef(then_future_ok((v: string) => future_err(v.length > 0))(future_err(false)), err(false), done);
        });
    });

    describe('then_future_err', () => {
        it('case 1', done => {
            dsef(then_future_err((e: string) => future_err(`oh ${e}`))(future_ok(123)), ok(123), done);
        });
        it('case 2', done => {
            dsef(then_future_err((e: string) => future_err(`oh ${e}`))(future_err('error')), err('oh error'), done);
        });
    });

    describe('map_future_ok', () => {
        it('case 1', done => {
            dsef(map_future_ok((v: string) => v.length)(future_ok('abc')), ok(3), done);
        });
        it('case 2', done => {
            dsef(map_future_ok((v: string) => v.length)(future_err(true)), err(true), done);
        });
    });

    describe('map_future_err', () => {
        it('case 1', done => {
            dsef(map_future_err((e: string) => `oh ${e}`)(future_ok(123)), ok(123), done);
        });
        it('case 2', done => {
            dsef(map_future_err((e: string) => `oh ${e}`)(future_err('error')), err('oh error'), done);
        });
    });
});
