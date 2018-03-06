import 'raf-polyfill';

import './style.scss';
import { init } from 'literium/client';
import { main } from './main';

init()(main);
