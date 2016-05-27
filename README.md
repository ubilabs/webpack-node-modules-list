[![npm version](https://badge.fury.io/js/webpack-node-modules-list.svg)](https://badge.fury.io/js/webpack-node-modules-list)

Exports meta data of all used node modules of a webpack bundle to a file.

Currently all included node modules of the webpack chunck `vendor` will be collected and the name, version, license and link to the repo will be written to a `npm-modules.md` file in the webpack output dir. This plugin works perfectly with `SplitByPathPlugin` plugin.

```
const ExportNodeModules = require('webpack-node-modules-list'),
  SplitByPathPlugin = require('webpack-split-by-path');

module.exports = {
plugins: [
  new SplitByPathPlugin([
    {
      name: 'vendor',
      path: path.join(__dirname, 'node_modules')
    }
  ]),
  new ExportNodeModules()
]}
```
