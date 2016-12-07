# Node Modules List Webpack Plugin

[![npm version](https://badge.fury.io/js/webpack-node-modules-list.svg)](https://badge.fury.io/js/webpack-node-modules-list)

Exports metadata of all used node modules of a webpack bundle to a file.

## Usage

This plugin creates a list with the name, version, license, and link to the repo of each node module in the webpack bundle.
The output file name can be configured, and defaults to `npm-modules.md`

```
const ExportNodeModules = require('webpack-node-modules-list');

module.exports = {
plugins: [
  new ExportNodeModules()
]}
```

### Options

An options object may be passed to the constructor.

#### options.chunkName
This option allows to filter the output so that it only includes chunks with a matching chunk name.

#### options.outputFile
This option allows to change the name of the output file. The file path is relative to the webpack output directory.

#### options.format
This option allows to change the output format. `markdown` and `json` are supported.

#### Example

This plugin works perfectly with the `SplitByPathPlugin` plugin.
The example below demonstrates all configurable features.

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
  new ExportNodeModules({chunkName, outputFile: 'npm', format: 'markdown'})
]}
```
