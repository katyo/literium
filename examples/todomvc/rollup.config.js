/* -*- mode: typescript; -*- */
import { join } from 'path';
import nodeResolve from 'rollup-plugin-node-resolve';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
//import closure from 'rollup-plugin-closure-compiler-js';
import replace from 'rollup-plugin-replace';
import { compress } from 'node-zopfli';
import gzip from 'rollup-plugin-gzip';
import { plugin as analyze } from 'rollup-plugin-analyzer';
import visualize from 'rollup-plugin-visualizer';
import postcss_import from 'postcss-import';

const { stringify } = JSON;

const {
    npm_package_version: version,
    npm_package_config_output_directory: outdir,
    DEV: devel
} = process.env;

const distdir = outdir || 'dist';

export default {
    context: 'this',
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
        nodeResolve({
            browser: true,
        }),
        typescript({
            tsconfigOverride: {
                compilerOptions: {
                    module: 'ESNext'
                }
            }
        }),
        replace({
            'process.env.npm_package_version': stringify(version),
            NODE_ENV: stringify(devel ? 'development' : 'production')
        }),
        sourceMaps(),
        terser({
            ecma: 5,
            warnings: 'verbose',
            ie8: true,
            safari10: true,
            mangle: devel ? false : {
                toplevel: true,
                keep_fnames: false,
            },
            compress: {
                unused: true,
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
        /*closure({
            languageIn: 'ES6',
            languageOut: 'ES5',
            compilationLevel: 'ADVANCED',
            warningLevel: 'VERBOSE',
            assumeFunctionWrapper: true,
            externs: ['process', 'global', 'sessionStorage', 'localStorage']
        }),*/
        gzip({
            customCompression: content => compress(Buffer.from(content), 'deflate'),
            gzipOptions: {
                level: 9,
                //numiterations: 10
            },
            additionalFiles: [
                join(distdir, `client_${version}.min.css`),
                join(distdir, 'client.html')
            ],
        }),
        //analyze(),
        /*visualize({
            filename: join(distdir, 'stats.html')
        })*/
    ],
}
