import { dsef } from './test';
import {
    future_ok, future_err,
    then_future_ok, then_future_err,
    map_future_ok, map_future_err,

    ok, err,
} from '../src/index';

describe('future result', () => {
    it('future sync', () => {
        dsef(future_ok(123), ok(123));
        dsef(future_err('unknown'), err('unknown'));
    });

    it('future async ok', done => {
        dsef(future_ok(123), ok(123), done);
    });

    it('future async err', done => {
        dsef(future_err('unknown'), err('unknown'), done);
    });

    it('then_future_ok', () => {
        dsef(then_future_ok((v: string) => future_ok(`then ${v}`))(future_ok('abc')), ok('then abc'));
        dsef(then_future_ok((v: string) => future_ok(`then ${v}`))(future_err(false)), err(false));
        dsef(then_future_ok((v: string) => future_err(v.length > 0))(future_ok('abc')), err(true));
        dsef(then_future_ok((v: string) => future_err(v.length > 0))(future_err(false)), err(false));
    });

    it('then_future_err', () => {
        dsef(then_future_err((e: string) => future_err(`oh ${e}`))(future_ok(123)), ok(123));
        dsef(then_future_err((e: string) => future_err(`oh ${e}`))(future_err('error')), err('oh error'));
    });

    it('map_future_ok', () => {
        dsef(map_future_ok((v: string) => v.length)(future_ok('abc')), ok(3));
        dsef(map_future_ok((v: string) => v.length)(future_err(true)), err(true));
    });

    it('map_future_err', () => {
        dsef(map_future_err((e: string) => `oh ${e}`)(future_ok(123)), ok(123));
        dsef(map_future_err((e: string) => `oh ${e}`)(future_err('error')), err('oh error'));
    });
});
