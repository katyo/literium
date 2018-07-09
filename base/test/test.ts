import { deepStrictEqual as dse } from 'assert';
import { Future, Done } from '../src/index';

export function dsef<Type>(actual: Future<Type>, expected: Type, done?: Done) {
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
