import { join } from 'path';
import { optimize, DefinePlugin, LoaderOptionsPlugin } from 'webpack';
import * as ExtractTextPlugin from 'extract-text-webpack-plugin';
import * as CompressionPlugin from 'compression-webpack-plugin';
import { RenderHtmlPlugin } from 'literium-runner/render-html-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { main } from './src/main';

const { UglifyJsPlugin } = optimize;
const { stringify } = JSON;

const client_css = `client_${process.env.npm_package_version}.min.css`;
const client_js = `client_${process.env.npm_package_version}.min.js`;

const css_extractor = new ExtractTextPlugin({
    filename: client_css,
    disable: process.env.npm_package_config_style_extraction == 'false'
});

export const context = __dirname;

export const entry = "client";

export const output = {
    path: join(__dirname, process.env.npm_package_config_output_directory || 'dist'),
    filename: client_js
};

export const resolve = {
    modules: ["node_modules", join(".", "src")],
    extensions: [".ts", ".js", ".json", ".css"]
};

export const devtool = "source-map";

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

const sass_loader_options = {
    includePaths: [
        join(__dirname, "src"),
        join(__dirname, "node_modules", "cutestrap", "dist", "scss")
    ],
    sourceMap: true
};

const url_loader_options = {
    limit: 60 * 1 << 10
};

const loader_options = {
    minimize: true,
    debug: false
};

const ts_loader_options = {
    compilerOptions: {
        //module: 'es6'
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

export const module = {
    rules: [
        {
            test: /\.ts$/,
            use: [
                {
                    loader: "ts-loader",
                    options: ts_loader_options,
                }
            ]
        },
        {
            test: /\.scss$/,
            use: css_extractor.extract({
                fallback: "style-loader",
                use: [
                    {
                        loader: "css-loader",
                        options: css_loader_options
                    },
                    {
                        loader: "sass-loader",
                        options: sass_loader_options
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
};

export const plugins = [
    new DefinePlugin(define_options),
    new LoaderOptionsPlugin(loader_options),
    css_extractor,
    new RenderHtmlPlugin(render_html_options),
    new UglifyJsPlugin(uglify_js_options),
    new CompressionPlugin(compression_options),
    new BundleAnalyzerPlugin(bundle_analyzer_options)
];

export const watchOptions = {
    aggregateTimeout: 500,
    poll: 2000,
    ignored: [
        /node_modules/,
        "**/*.js",
        "**/*.html"
    ]
};
