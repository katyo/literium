import 'raf-polyfill';

import './style.css';
import { init } from 'literium-runner/client';
import { main } from './main';

init()(main);
