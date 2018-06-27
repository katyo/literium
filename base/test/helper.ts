import { deepStrictEqual as dse } from 'assert';
import {
    mk_seq,
    do_seq,
    flat_map,
    flat_list,
    flat_all,
} from '../src/index';

describe('helper', () => {
    it('mk_seq', () => {
        dse(mk_seq(
            (v: number) => v + 1,
            (v: number) => `value=${v}`,
            (v: string) => `${v};`
        ).call(this, 123), 'value=124;');
    });

    it('do_seq', () => {
        dse(do_seq(
            123,
            (v: number) => v + 1,
            (v: number) => `value=${v}`,
            (v: string) => `${v};`
        ), 'value=124;');
    });

    it('flat_map', () => {
        dse(flat_map((a: number) => a + 1)([1, 2, [3, 4], [5, 6], 7]), [2, 3, 4, 5, 6, 7, 8]);
    });

    it('flat_list', () => {
        dse(flat_list([1, 2, [3, 4], [5, 6], 7]), [1, 2, 3, 4, 5, 6, 7]);
    });

    it('flat_all', () => {
        dse(flat_all(1, 2, [3, 4], [5, 6], 7), [1, 2, 3, 4, 5, 6, 7]);
    });
});
