const path = require('path');

module.exports = {
    entry: './src/webview/index.tsx',
    output: {
        path: path.resolve(__dirname, 'media'),
        filename: 'webview.bundle.js',
    },
    devtool: 'inline-source-map',
    resolve: {
        extensions: ['.js', '.ts', '.tsx', '.json'],
        fallback: {
            "fs": false,
            "path": false,
            "crypto": false,
            "stream": false,
            "buffer": false
        }
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                loader: 'ts-loader',
                options: {
                }
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }
        ]
    },
    performance: {
        hints: false
    }
};
