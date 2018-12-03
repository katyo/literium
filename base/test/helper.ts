import { deepStrictEqual as dse } from 'assert';
import {
    mk_seq,
    do_seq,
    flat_map,
    flat_list,
    flat_all,
    deferred,
} from '../src/index';

describe('helper', () => {
    it('mk_seq', () => {
        dse(mk_seq(
            (v: number) => v + 1,
            (v: number) => `value=${v}`,
            (v: string) => `${v};`
        )(123), 'value=124;');
    });

    it('do_seq', () => {
        dse(do_seq(
            123,
            (v: number) => v + 1,
            (v: number) => `value=${v}`,
            (v: string) => `${v};`
        ), 'value=124;');
    });

    describe('deferred', () => {
        it('execute', done => {
            const s: number[] = [];
            deferred((a: number, b: number) => {
                s.push(a);
                s.push(b);
            })(1, 2);
            setTimeout(() => {
                dse(s, [1, 2]);
                done();
            }, 0);
        });
        it('cancel', done => {
            const s: number[] = [];
            const u = deferred((a: number, b: number) => {
                s.push(a);
                s.push(b);
            })(1, 2);
            setTimeout(() => {
                dse(s, []);
                done();
            }, 0);
            u();
        });
    });

    it('flat_map', () => {
        dse(flat_map((a: number) => a + 1)([1, 2, [3, 4], [5, 6], 7]), [2, 3, 4, 5, 6, 7, 8]);
        dse(do_seq(
            [1, 2, [3, 4], [5, 6], 7],
            flat_map(a => a + 1)
        ), [2, 3, 4, 5, 6, 7, 8]);
    });

    it('flat_list', () => {
        dse(flat_list([1, 2, [3, 4], [5, 6], 7]), [1, 2, 3, 4, 5, 6, 7]);
    });

    it('flat_all', () => {
        dse(flat_all(1, 2, [3, 4], [5, 6], 7), [1, 2, 3, 4, 5, 6, 7]);
    });
});
