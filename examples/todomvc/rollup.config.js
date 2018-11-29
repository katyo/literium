/* -*- mode: typescript; -*- */
import { join } from 'path';
import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import replace from 'rollup-plugin-replace';
import gzip from 'rollup-plugin-gzip';
import visualize from 'rollup-plugin-visualizer';
import postcss_import from 'postcss-import';
import { compress } from 'node-zopfli';

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
        gzip({
            customCompression: content => compress(Buffer.from(content), 'deflate'),
            additionalFiles: [
                join(distdir, `client_${version}.min.css`),
                join(distdir, 'client.html')
            ],
        }),
        /*visualize({
            filename: join(distdir, 'stats.html')
        })*/
    ],
}
