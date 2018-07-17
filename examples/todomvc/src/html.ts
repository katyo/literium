import { join } from 'path';
import { createWriteStream, stat, mkdir } from 'fs';
import { init } from 'literium-runner/server';
import { main } from './main';

const distdir = process.env.npm_package_config_output_directory || 'dist';

const render = init();

stat(distdir, (err, stat) => {
    if (!err && stat.isDirectory()) {
        produce();
    } else {
        mkdir(distdir, err => {
            if (err) throw err;
            produce();
        });
    }
});

function produce() {
    const name = 'client.html';
    const file = join(distdir, name);
    console.log(`generating ${name}`);
    render(main)(([html,]) => {
        const stm = createWriteStream(file);
        html.pipe(stm);
        stm.on('error', err => {
            console.log('error', err);
        });
        stm.on('end', () => {
            console.log('ok');
        });
    });
}
