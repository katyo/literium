import 'setimmediate';
import { Send, Done, Fork } from './types';

export function fork_pool<Event>(send: Send<Event>, done: Done): Fork<Event> {
    let count = 0;
    const fork: [Send<Event>, Done] = [(event) => {
        setImmediate(() => {
            send(event);
        });
    }, () => {
        if (!--count) {
            done_id = setImmediate(done);
        }
    }];
    let done_id = setImmediate(done);
    return () => {
        clearImmediate(done_id);
        ++count;
        return fork;
    };
}
