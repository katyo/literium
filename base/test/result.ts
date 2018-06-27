import { deepStrictEqual as dse, throws } from 'assert';
import {
    ok, err,
    is_ok, is_err,
    then_ok, then_err,
    map_ok, map_err,
    and_ok, or_err,
    un_ok, un_err,
    un_ok_or, un_err_or,
    un_ok_else, un_err_else,
    some_ok, some_err,
    a_ok, b_ok,
    ok_def, err_def,
    ok_def_or, err_def_or,
    ok_def_else, err_def_else,
    ok_try,

    some, none,
    a, b,
} from '../src/index';

describe('result', () => {
    it('is_ok', () => {
        dse(is_ok(ok('abc')), true);
        dse(is_ok(err(undefined)), false);
    });

    it('is_err', () => {
        dse(is_err(ok('abc')), false);
        dse(is_err(err(undefined)), true);
    });

    it('then_ok', () => {
        dse(then_ok((v: string) => ok(v.length))(ok('abc')), ok(3));
        dse(then_ok((v: string) => ok(v.length))(err('unknown')), err('unknown'));
    });

    it('then_err', () => {
        dse(then_err((v: string) => err(v.length))(ok('abc')), ok('abc'));
        dse(then_err((v: string) => err(v.length))(err('unknown')), err(7));
    });

    it('map_ok', () => {
        dse(map_ok((v: string) => v.length)(ok('abc')), ok(3));
        dse(map_ok((v: string) => v.length)(err('unknown')), err('unknown'));
    });

    it('map_err', () => {
        dse(map_err((v: string) => v.length)(ok('abc')), ok('abc'));
        dse(map_err((v: string) => v.length)(err('unknown')), err(7));
    });

    it('and_ok', () => {
        dse(and_ok(13)(ok('abc')), ok(13));
        dse(and_ok(13)(err('unknown')), err('unknown'));
    });

    it('or_err', () => {
        dse(or_err('error')(ok('abc')), ok('abc'));
        dse(or_err('error')(err('unknown')), err('error'));
    });

    it('un_ok', () => {
        dse(un_ok(ok('abc')), 'abc');
        throws(() => un_ok(err('unknown')));
    });

    it('un_err', () => {
        throws(() => un_err(ok('abc')));
        dse(un_err(err('unknown')), 'unknown');
    });

    it('un_ok_or', () => {
        dse(un_ok_or('error')(ok('abc')), 'abc');
        dse(un_ok_or('error')(err('unknown')), 'error');
    });

    it('un_err_or', () => {
        dse(un_err_or('success')(ok('abc')), 'success');
        dse(un_err_or('success')(err('unknown')), 'unknown');
    });

    it('un_ok_else', () => {
        dse(un_ok_else(e => `${e} error`)(ok('abc')), 'abc');
        dse(un_ok_else(e => `${e} error`)(err('unknown')), 'unknown error');
    });

    it('un_err_else', () => {
        dse(un_err_else(v => `success ${v}`)(ok('abc')), 'success abc');
        dse(un_err_else(v => `success ${v}`)(err('unknown')), 'unknown');
    });

    it('some_ok', () => {
        dse(some_ok(ok('abc')), some('abc'));
        dse(some_ok(err('error')), none());
    });

    it('some_err', () => {
        dse(some_err(ok('abc')), none());
        dse(some_err(err('unknown')), some('unknown'));
    });

    it('a_ok', () => {
        dse(a_ok(ok('abc')), a('abc'));
        dse(a_ok(err('error')), b('error'));
    });

    it('b_ok', () => {
        dse(b_ok(ok(123)), b(123));
        dse(b_ok(err('unknown')), a('unknown'));
    });

    it('ok_def', () => {
        dse(ok_def('abc'), ok('abc'));
        dse(ok_def(undefined), err(undefined));
        dse(ok_def(null), err(undefined));
    });

    it('err_def', () => {
        dse(err_def('abc'), err('abc'));
        dse(err_def(undefined), ok(undefined));
        dse(err_def(null), ok(undefined));
    });

    it('ok_def_or', () => {
        dse(ok_def_or('none')('abc'), ok('abc'));
        dse(ok_def_or('none')(undefined), err('none'));
        dse(ok_def_or('none')(null), err('none'));
    });

    it('err_def_or', () => {
        dse(err_def_or('some')('abc'), err('abc'));
        dse(err_def_or('some')(undefined), ok('some'));
        dse(err_def_or('some')(null), ok('some'));
    });

    it('ok_def_else', () => {
        dse(ok_def_else(() => 'none')('abc'), ok('abc'));
        dse(ok_def_else(() => 'none')(undefined), err('none'));
        dse(ok_def_else(() => 'none')(null), err('none'));
    });

    it('err_def_else', () => {
        dse(err_def_else(() => 'some')('abc'), err('abc'));
        dse(err_def_else(() => 'some')(undefined), ok('some'));
        dse(err_def_else(() => 'some')(null), ok('some'));
    });

    it('ok_try', () => {
        dse(ok_try(() => 1)(), ok(1));
        dse(ok_try(() => { throw 2; })(), err(2));

        const safe_div = ok_try((a: number, b: number) => {
            if (b != 0) {
                return a / b;
            } else {
                throw 'division by zero';
            }
        });

        dse(safe_div(9, 3), ok(3));
        dse(safe_div(1, 0), err('division by zero'));
    });
});
