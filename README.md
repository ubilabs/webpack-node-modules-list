# Node Modules List Webpack Plugin

[![npm version](https://badge.fury.io/js/webpack-node-modules-list.svg)](https://badge.fury.io/js/webpack-node-modules-list)

Exports metadata of all used node modules of a webpack bundle to a file.  
This plugin works perfectly with the `SplitByPathPlugin` plugin.

## About

This plugin creates a list with the name, version, license, and link to the repo of each node module in the webpack bundle.  
The output file is currently hardcoded and set to `npm-modules.md` in the webpack output directory.

## Usage

Simply include this plugin in your webpack configuration file.

```
const ExportNodeModules = require('webpack-node-modules-list'),
  SplitByPathPlugin = require('webpack-split-by-path');

module.exports = {
plugins: [
  new ExportNodeModules()
]}
```

Alternatively, it is possible to pass a chunk name to the constructor.  
This allows to filter the output so that it only includes chunks with a matching chunk name.

```
const ExportNodeModules = require('webpack-node-modules-list'),
  SplitByPathPlugin = require('webpack-split-by-path'),
  chunkName = 'vendor';

module.exports = {
plugins: [
  new SplitByPathPlugin([
    {
      name: chunkName,
      path: path.join(__dirname, 'node_modules')
    }
  ]),
  new ExportNodeModules({chunkName})
]}
```
