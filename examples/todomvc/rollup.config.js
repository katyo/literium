/* -*- mode: typescript; -*- */
import { join } from 'path';
import nodeResolve from 'rollup-plugin-node-resolve';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import { uglify } from 'rollup-plugin-uglify';
import replace from 'rollup-plugin-replace';
import gzip from 'rollup-plugin-gzip';
import postcss_import from 'postcss-import';
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
        postcss({
            extract: true,
            minimize: true,
            sourceMap: true,
            plugins: [
                postcss_import({
                    path: ['node_modules']
                })
            ]
        }),
        replace({
            'process.env.npm_package_version': stringify(version),
            NODE_ENV: stringify('production')
        }),
        nodeResolve({
            browser: true,
        }),
        sourceMaps(),
        uglify({
            ie8: true,
            mangle: {
                toplevel: true,
                //safari10: true,
                keep_fnames: false,
            },
            compress: {
                //ecma: 5,
                toplevel: true,
                keep_fargs: false,
                keep_fnames: false,
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
