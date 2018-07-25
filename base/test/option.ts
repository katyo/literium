import { deepStrictEqual as dse, throws } from 'assert';
import {
    some, none,
    is_some, is_none,
    then_some, then_none,
    map_some, map_none,
    and_some, or_none,
    un_some,
    un_some_or,
    un_some_else,
    ok_some_or, err_some_or,
    a_some_or, b_some_or,

    ok, err,
    a, b,
} from '../src/index';

describe('option', () => {
    it('is_some', () => {
        dse(is_some(some('abc')), true);
        dse(is_some(none()), false);
    });

    it('is_none', () => {
        dse(is_none(some('abc')), false);
        dse(is_none(none()), true);
    });

    it('then_some', () => {
        dse(then_some((v: number) => some(v + 1))(some(123)), some(124));
        dse(then_some((v: number) => some(v + 1))(none()), none());
    });

    it('then_none', () => {
        dse(then_none(() => some(true))(some(true)), some(true));
        dse(then_none(() => some(false))(none()), some(false));
    });

    it('map_some', () => {
        dse(map_some((v: number) => v + 1)(some(123)), some(124));
        dse(map_some((v: number) => v + 1)(none()), none());
    });

    it('map_none', () => {
        dse(map_none(() => true)(some(true)), some(true));
        dse(map_none(() => true)(none()), none());
    });

    it('and_some', () => {
        dse(and_some(false)(some(true)), some(false));
        dse(and_some(false)(none()), none());
    });

    it('or_none', () => {
        dse(or_none(false)(some(true)), some(true));
        dse(or_none(false)(none()), some(false));
    });

    it('un_some', () => {
        dse(un_some(some(true)), true);
        throws(() => un_some(none()));
    });

    it('un_some_or', () => {
        dse(un_some_or(false)(some(true)), true);
        dse(un_some_or(false)(none()), false);
    });

    it('un_some_else', () => {
        dse(un_some_else(() => false)(some(true)), true);
        dse(un_some_else(() => false)(none()), false);
    });

    it('ok_some_or', () => {
        dse(ok_some_or('unknown')(some(123)), ok(123));
        dse(ok_some_or('unknown')(none()), err('unknown'));
    });

    it('err_some_', () => {
        dse(err_some_or(123)(some('error')), err('error'));
        dse(err_some_or(123)(none()), ok(123));
    });

    it('a_some_or', () => {
        dse(a_some_or('unknown')(some(123)), a(123));
        dse(a_some_or('unknown')(none()), b('unknown'));
    });

    it('b_some_or', () => {
        dse(b_some_or(123)(some('unknown')), b('unknown'));
        dse(b_some_or(123)(none()), a(123));
    });
});
