/* -*- mode: typescript; -*- */
import { join } from 'path';
import nodeResolve from 'rollup-plugin-node-resolve';
import makeDeps from 'rollup-plugin-make';
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import { uglify } from 'rollup-plugin-uglify';
import replace from 'rollup-plugin-replace';
import gzip from 'rollup-plugin-gzip';
import visualize from 'rollup-plugin-visualizer';
import { compress } from 'node-zopfli';

const { stringify } = JSON;

const {
    npm_package_version: version,
    npm_package_config_output_directory: outdir
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
            sourceMap: true,
            use: [['sass', {
                includePaths: ['node_modules']
            }]],
            minimize: {
                preset: ['advanced', { autoprefixer: { browsers: ['> 1%'] } }]
            },
        }),
        replace({
            'process.env.npm_package_version': stringify(version),
            NODE_ENV: stringify('production')
        }),
        nodeResolve({
            browser: true,
        }),
        typescript({
            tsconfigOverride: {
                compilerOptions: {
                    module: 'es6'
                }
            }
        }),
        makeDeps({
            mangle: file => join(distdir, `${file.replace(distdir + '/', '')}.d`),
        }),
        uglify({
            ie8: true,
            mangle: {
                toplevel: true,
                keep_fnames: false,
            },
            compress: {
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
        visualize({
            filename: join(distdir, 'stats.html'),
            //sourcemap: true
        }),
        gzip({
            customCompression: content => compress(Buffer.from(content), 'deflate'),
            additionalFiles: [
                join(distdir, `client_${version}.min.css`),
                join(distdir, 'client.html')
            ],
        }),
    ],
}
