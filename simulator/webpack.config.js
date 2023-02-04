const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: 'urdf.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    allowedHosts: 'all',
    compress: true,
    port: 9000,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        "./public", // absolute or relative, files/directories/globs - see below for examples
      ],
      options: {
        concurrency: 100,
      },
    }),
  ],
};