import 'raf-polyfill';

import './style.scss';
import { init } from '@literium/runner/es/client';
import { main } from './main';

init()(main)({
    fast: false
});
