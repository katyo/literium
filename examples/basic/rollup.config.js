/* -*- mode: typescript; -*- */
import { join } from 'path';
import nodeResolve from 'rollup-plugin-node-resolve';
import make from 'rollup-plugin-make';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import sass from 'rollup-plugin-sass';
import uglify from 'rollup-plugin-uglify';
import replace from 'rollup-plugin-replace';
import gzip from 'rollup-plugin-gzip';
import visualize from 'rollup-plugin-visualizer';

const { stringify } = JSON;

const {
    npm_package_version: version,
    npm_package_config_output_directory: outdir
} = process.env;

const distdir = outdir || 'dist';

export default {
    input: `src/client.ts`,
    output: {
        file: join(distdir, `client_${version}.min.js`),
        format: 'cjs',
        sourcemap: true
    },
    watch: {
        include: 'src/**',
    },
    plugins: [
        typescript({
            tsconfigOverride: {
                compilerOptions: {
                    module: 'es6'
                }
            }
        }),
        sass({
            output: true,
            options: {
                outputStyle: 'compressed',
                sourceMap: true,
                includePaths: [
                    'node_modules/cutestrap/dist/scss',
                    'node_modules/literium-highlight/styles'
                ]
            }
        }),
        replace({
            'process.env.npm_package_version': stringify(version),
            NODE_ENV: stringify('production')
        }),
        nodeResolve({
            browser: true,
        }),
        make({
            mangle: file => join(distdir, `${file.replace(distdir + '/', '')}.d`),
        }),
        sourceMaps(),
        uglify({
            ie8: true,
            mangle: {
                toplevel: true,
                safari10: true
            },
            compress: {
                ecma: 5,
                toplevel: true,
                keep_fargs: false,
                warnings: true,
                inline: 2,
                passes: 2,
            },
            output: {
                comments: false
            }
        }),
        gzip({
            algorithm: 'zopfli',
            options: {
                level: 9,
                numiterations: 10
            },
            additional: [
                join(distdir, `client_${version}.min.css`),
                join(distdir, 'client.html')
            ],
        }),
        visualize({
            filename: join(distdir, 'stats.html')
        }),
    ],
}
