import { Send, Done, Fork } from './types';

export function fork_pool<Event>(send: Send<Event>, done: Done): [Fork<Event>, Done] {
    let state = false; /* suspended by default */
    let forks = 0;
    const events: Event[] = [];
    const deque = () => {
        for (; events.length;) {
            state = false;
            send(events.shift() as Event);
            state = true;
        }
        if (!forks) {
            done();
        }
    };
    const fork: [Send<Event>, Done] = [
        (event) => { /* send */
            events.push(event);
            if (state) {
                deque();
            }
        },
        () => { /* done */
            forks--;
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
