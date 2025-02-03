const path = require('path');

module.exports = {
  target: 'node',
  mode: 'none', // Development mode (change to 'production' later)
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'out'), // Changed from 'dist' to 'out'
    filename: 'extension.js', // Single bundled output file
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode' // Exclude VS Code API
  },
  resolve: {
    extensions: ['.ts', '.js'] // File extensions to resolve
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader' // Compile TypeScript
          }
        ]
      }
    ]
  },
  devtool: 'source-map' // Better debugging
};