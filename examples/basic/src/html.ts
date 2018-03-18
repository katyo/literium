import { join } from 'path';
import { writeFile, stat, mkdir } from 'fs';
import { init } from 'literium-runner/server';
import { main } from './main';

const distdir = process.env.npm_package_config_output_directory || 'dist';

const render = init();

stat(distdir, (err, stat) => {
    if (!err && stat.isDirectory()) {
        store();
    } else {
        mkdir(distdir, err => {
            if (err) throw err;
            store();
        });
    }
});

function store() {
    const file = join(distdir, 'client.html');
    render(main, html => {
        writeFile(file, html, err => {

        });
    });
}
