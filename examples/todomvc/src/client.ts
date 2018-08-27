import 'raf-polyfill';

import './style.css';
import { init } from '@literium/runner/es/client';
import { main } from './main';

init()(main)({ store: 'todo' });
