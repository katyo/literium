import { deepStrictEqual as dse } from 'assert';
import {
    Future,

    future,
    timeout,
    then_future,
    map_future,

    select_future,
    join_future,
} from '../src/index';

function dsef<Value>(actual: Future<Value>, expected: Value, done?: () => void) {
    if (done) {
        setTimeout(() => {
            actual(actual => {
                dse(actual, expected);
                done();
            });
        }, 0);
    } else {
        actual(actual => {
            dse(actual, expected);
        });
    }
}

describe('future', () => {
    it('future sync', () => {
        dsef(future(123), 123);
    });

    it('future async', done => {
        dsef(future(123), 123, done);
    });

    it('timeout', done => {
        dsef(timeout(100)(123), 123, done);
    });

    it('then_future', () => {
        dsef(then_future((v: string) => future(`then ${v}`))(future('abc')), 'then abc');
    });

    it('map_future', () => {
        dsef(map_future((v: string) => v.length)(future('abc')), 3);
    });

    describe('select_future', () => {
        it('case 1', done => {
            dsef(select_future(timeout(50)(50), timeout(80)(80)), 50, done);
        });
        it('case 2', done => {
            dsef(select_future(timeout(100)(100), timeout(40)(40)), 40, done);
        });
    });

    describe('join_future', () => {
        it('case 1', done => {
            dsef(join_future(timeout(50)(50), timeout(80)(80)), [50, 80], done);
        });
        it('case 2', done => {
            dsef(join_future(timeout(100)(100), timeout(40)(40)), [100, 40], done);
        });
    });
});
