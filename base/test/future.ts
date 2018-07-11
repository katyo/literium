import { deepStrictEqual as dse } from 'assert';
import { dsef } from './test';
import {
    future,
    timeout,
    then_future,
    map_future,

    select_future,
    join_future,
    fork_future,
    timeout_future,

    constant, do_seq
} from '../src/index';

describe('future', () => {
    it('future async', done => {
        dsef(future(123), 123, done);
    });

    it('timeout', done => {
        dsef(map_future(() => 123)(timeout(100)), 123, done);
    });

    it('then_future', done => {
        dsef(then_future((v: string) => future(`then ${v}`))(future('abc')), 'then abc', done);
    });

    it('map_future', done => {
        dsef(map_future((v: string) => v.length)(future('abc')), 3, done);
    });

    describe('then_future', () => {
        it('case 1', done => {
            const s: number[] = [];
            const u = do_seq(
                timeout(50),
                // stop
                then_future(_ => (s.push(_), timeout(150))),
            )(_ => {
                s.push(_);
            });
            setTimeout(() => {
                s.push(100);
                u();
            }, 100);
            setTimeout(() => {
                dse(s, [50, 100]);
                done();
            }, 200);
        });

        it('case 2', done => {
            const s: number[] = [];
            const u = do_seq(
                timeout(50),
                // stop
                then_future(_ => (s.push(_), timeout(150))),
                then_future(_ => (s.push(_), timeout(250))),
            )(_ => {
                s.push(_);
            });
            setTimeout(() => {
                s.push(100);
                u();
            }, 100);
            setTimeout(() => {
                s.push(200);
            }, 200);
            setTimeout(() => {
                dse(s, [50, 100, 200]);
                done();
            }, 300);
        });
    });

    describe('map_future', () => {
        it('case 1', done => {
            const s: number[] = [];
            const u = do_seq(
                timeout(50),
                // stop
                map_future(_ => (s.push(_), _)),
                then_future(_ => timeout(150)),
            )(_ => {
                s.push(_);
            });
            setTimeout(() => {
                s.push(100);
                u();
            }, 100);
            setTimeout(() => {
                dse(s, [50, 100]);
                done();
            }, 200);
        });

        it('case 2', done => {
            const s: number[] = [];
            const u = do_seq(
                timeout(50),
                // stop
                map_future(_ => (s.push(_), _)),
                then_future(_ => timeout(150)),
                map_future(_ => (s.push(_), _)),
                then_future(_ => timeout(250)),
            )(_ => {
                s.push(_);
            });
            setTimeout(() => {
                s.push(100);
                u();
            }, 100);
            setTimeout(() => {
                s.push(200);
            }, 200);
            setTimeout(() => {
                dse(s, [50, 100, 200]);
                done();
            }, 300);
        });
    });

    describe('select_future', () => {
        it('case 1', done => {
            const s: number[] = [];
            select_future(
                do_seq(
                    timeout(50),
                    map_future(_ => (s.push(_), _))
                ),
                do_seq(
                    timeout(80),
                    map_future(_ => (s.push(_), _))
                )
            )(r => {
                s.push(r + 5);
            });
            setTimeout(() => {
                dse(s, [50, 55]);
                done();
            }, 150);
        });

        it('case 2', done => {
            dsef(select_future(timeout(100), timeout(40)), 40, done);
        });
    });

    describe('timeout_future', () => {
        it('case 1', done => {
            const s: number[] = [];
            timeout_future(100)(100)(do_seq(
                future(0),
                then_future(_ => (s.push(_), timeout(50))),
                then_future(_ => (s.push(_), timeout(80))),
                then_future(_ => (s.push(_), future(30))),
            ))(_ => {
                s.push(_);
            });
            setTimeout(() => {
                dse(s, [0, 50, 100]);
                done();
            }, 200);
        });
    });

    describe('join_future', () => {
        it('case 1', done => {
            const s: number[] = [];
            join_future(
                do_seq(
                    timeout(50),
                    map_future(_ => (s.push(_), _))
                ),
                do_seq(
                    timeout(80),
                    map_future(_ => (s.push(_), _))
                )
            )(([a, b]) => {
                s.push(a + b);
            });
            setTimeout(() => {
                dse(s, [50, 80, 130]);
                done();
            }, 170);
        });
        it('case 2', done => {
            dsef(join_future(timeout(100), timeout(40)), [100, 40], done);
        });
    });

    describe('fork_future', () => {
        const f = fork_future(do_seq(
            timeout(80),
            map_future(constant(11)),
        ));

        it('case 1 & 2', done => {
            let n = 2;
            dsef(f(), 11, () => { if (!--n) done(); });
            dsef(f(), 11, () => { if (!--n) done(); });
        });
        it('case 3', done => {
            setTimeout(() => {
                dsef(f(), 11, done);
            }, 150);
        });
    });
});
