const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

module.exports = {
  entry: './script_firebasedb.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  mode: 'development', // or 'production' for production build
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  plugins: [
    // Define environment variables for use in your code
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
    }),
  ],
  devtool: 'source-map', // Optional: for easier debugging

  // Dev Server Configuration
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'), // Serve files from 'dist' directory
    },
    compress: true, // Enable gzip compression for everything served
    port: 8080, // Port to run the server on
    open: true, // Open the browser after the server is started
    hot: true, // Enable Hot Module Replacement (HMR)
    client: {
      overlay: true, // Show error messages on the browser overlay
    },
  },
};
