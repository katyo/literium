import 'raf-polyfill';

import './style.scss';
import { init } from 'literium-runner/client';
import { main } from './main';

init()(main);
