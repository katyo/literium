import 'raf-polyfill';

import './style.css';
import { init } from 'literium/client';
import { main } from './main';

init()(main);
