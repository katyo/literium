import { join } from 'path';
import { Configuration, optimize, DefinePlugin } from 'webpack';
import * as ExtractTextPlugin from 'extract-text-webpack-plugin';
import * as CompressionPlugin from 'compression-webpack-plugin';
import { RenderHtmlPlugin } from 'literium-runner/render-html-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { main } from './src/main';

const { UglifyJsPlugin, ModuleConcatenationPlugin } = optimize;
const { stringify } = JSON;

const client_css = `client_${process.env.npm_package_version}.min.css`;
const client_js = `client_${process.env.npm_package_version}.min.js`;

const css_extractor = new ExtractTextPlugin({
    filename: client_css,
    disable: process.env.npm_package_config_style_extraction == 'false'
});

const define_options = {
    "process.env.NODE_ENV": stringify("production"),
    "process.env.npm_package_name": stringify(process.env.npm_package_name),
    "process.env.npm_package_version": stringify(process.env.npm_package_version),
};

const css_loader_options = {
    url: false,
    minimize: true,
    discardComments: {
        removeAll: true
    },
    sourceMap: true,
    importLoaders: 1
};

const url_loader_options = {
    limit: 60 * 1 << 10
};

const ts_loader_options = {
    compilerOptions: {
        module: "es6"
    }
};

const uglify_js_options = {
    sourceMap: true,
    beautify: false,
    mangle: {
        screw_ie8: true,
        keep_fnames: false
    },
    compress: {
        warnings: true,
        screw_ie8: true
    },
    comments: false
};

const render_html_options = {
    assets: [
        {
            filename: "client.html",
            view: main,
        }
    ]
};

const compression_options = {
    asset: "[path].gz[query]",
    algorithm: "gzip",
    test: process.env.npm_package_config_gzip_compression == 'true' ? /\.(?:js|css|html)$/ : /___/,
    threshold: 1 << 10,
    minRatio: 0.8
};

const bundle_analyzer_options: BundleAnalyzerPlugin.Options = {
    analyzerMode: "static",
    openAnalyzer: false
};

const config: Configuration = {
    entry: "client",

    output: {
        path: join(__dirname, process.env.npm_package_config_output_directory || 'dist'),
        filename: client_js
    },

    resolve: {
        modules: [join(".", "src"), 'node_modules'],
        extensions: [".ts", ".js", ".json", ".css"]
    },

    devtool: "source-map",

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: ts_loader_options
                    }
                ]
            },
            {
                test: /\.css$/,
                use: css_extractor.extract({
                    fallback: "style-loader",
                    use: [
                        {
                            loader: "css-loader",
                            options: css_loader_options
                        }
                    ]
                })
            },
            {
                test: /\.(?:je?pg|png|svg|eot|otf|ttf|woff2?)/,
                use: [
                    {
                        loader: "url-loader",
                        options: url_loader_options
                    }
                ]
            }
        ]
    },

    plugins: [
        new DefinePlugin(define_options),
        css_extractor,
        new RenderHtmlPlugin(render_html_options),
        new ModuleConcatenationPlugin(),
        new UglifyJsPlugin(uglify_js_options),
        new CompressionPlugin(compression_options),
        new BundleAnalyzerPlugin(bundle_analyzer_options)
    ],

    watchOptions: {
        aggregateTimeout: 500,
        poll: 2000,
        ignored: [
            "node_modules",
            "**/*.js",
            "**/*.html"
        ]
    },
};

export default config;
