import { deepStrictEqual as dse } from 'assert';
import {
    JSType,
    get_type,
    is_type,
    nothing,
    mk_seq,
    do_seq,
    flat_map,
    flat_list,
    flat_all,
    deferred,
} from '../src/index';

describe('helper', () => {
    it('get_type', () => {
        dse(get_type("abc"), JSType.String);
        dse(get_type(-0.1), JSType.Number);
        dse(get_type(true), JSType.Boolean);
        dse(get_type(nothing), JSType.Undefined);
        dse(get_type(() => {}), JSType.Function);
        dse(get_type([]), JSType.Array);
        dse(get_type({}), JSType.Object);

        dse(get_type([1]), JSType.Array);
        dse(get_type([1][0]), JSType.Number);
        dse(get_type({a:1}), JSType.Object);
        dse(get_type({a:1}.a), JSType.Number);

        dse(get_type([] as unknown), JSType.Array);
        dse(get_type({} as unknown), JSType.Object);
        dse(get_type(1 as unknown), JSType.Number);
    });

    it('is_type', () => {
        dse(is_type("abc", JSType.String), true);
        dse(is_type(-0.1, JSType.Number), true);
        dse(is_type(true, JSType.Boolean), true);
        dse(is_type(nothing, JSType.Undefined), true);
        dse(is_type(() => {}, JSType.Function), true);
        dse(is_type([], JSType.Array), true);
        dse(is_type({}, JSType.Object), true);

        dse(is_type([1], JSType.Array), true);
        dse(is_type([1][0], JSType.Number), true);
        dse(is_type({a:1}, JSType.Object), true);
        dse(is_type({a:1}.a, JSType.Number), true);

        dse(is_type([] as unknown, JSType.Array), true);
        dse(is_type({} as unknown, JSType.Object), true);
        dse(is_type(1 as unknown, JSType.Number), true);
    });
    
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
