import { deepStrictEqual as dse } from 'assert';
import {
    keyed,
    to_keyed,
    map_key,
    map_value,
    un_key,
    un_value
} from '../src/index';

describe('keyed', () => {
    it('to_keyed', () => {
        dse(to_keyed('abc')(123), keyed('abc', 123));
        dse(to_keyed(123)('abc'), keyed(123, 'abc'));
    });

    it('map_key', () => {
        dse(map_key((k: number) => k + 1)(keyed(123, false)), keyed(124, false));
        dse(map_key((k: string) => `key-${k}`)(keyed('abc', 123)), keyed('key-abc', 123));
    });

    it('map_value', () => {
        dse(map_value((v: number) => v + 1)(keyed('abc', 123)), keyed('abc', 124));
        dse(map_value((v: string) => `-${v}-`)(keyed(123, 'abc')), keyed(123, '-abc-'));
    });

    it('un_key', () => {
        dse(un_key(keyed(123, 'abc')), 123);
        dse(un_key(keyed('abc', 123)), 'abc');
    });

    it('un_value', () => {
        dse(un_value(keyed(123, 'abc')), 'abc');
        dse(un_value(keyed('abc', 123)), 123);
    });
});
