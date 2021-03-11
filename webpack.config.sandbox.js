const path = require("path");
const webpack = require('webpack');
const mainConfig = require('./webpack.config');
module.exports = {
  entry: {
    'platformer': './sandbox/src/platformer.ts',
    'collision': './sandbox/tests/physics/physics.ts',
    'zoom': './sandbox/tests/zoom/zoom.ts'
  },
  output: {
    path: path.resolve(__dirname, 'sandbox/build/'),
    filename: '[name].js',
  },
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    contentBase: path.join(__dirname, 'sandbox'),
    compress: true,
    port: 3001,
  },
  module: {
    rules: [
      ...mainConfig.module.rules
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      '(globalThis as any).__EX_VERSION': '\'sandbox-version\''
    }),
  ],
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "@excalibur": path.resolve(__dirname, './src/engine/')
    }
  }
};