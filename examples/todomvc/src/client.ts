import 'raf-polyfill';
import 'setimmediate';

import './style.css';
import { init } from 'literium-runner/es/client';
import { main } from './main';

init()(main);
