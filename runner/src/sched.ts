import { Emit, Done, Fork } from 'literium';

export function fork_pool<Signal>(emit: Emit<Signal>, done: Done): [Fork<Signal>, Done] {
    let state = false; /* suspended by default */
    let forks = 0;
    const signals: Signal[] = [];
    const deque = () => {
        for (; signals.length;) {
            state = false;
            emit(signals.shift() as Signal);
            state = true;
        }
        if (!forks) {
            done();
        }
    };
    const fork: [Emit<Signal>, Done] = [
        (signal) => { /* emit */
            signals.push(signal);
            if (state) {
                deque();
            }
        },
        () => { /* done */
            forks--;
            if (state) {
                deque();
            }
        }
    ];
    return [
        () => { /* fork */
            forks++;
            return fork;
        },
        () => { /* run */
            state = true;
            deque();
        }
    ];
}
