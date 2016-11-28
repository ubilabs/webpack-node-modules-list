'use strict';

const path = require('path'),
  fs = require('fs'),
  defaultOptions = {
    outputFile: 'npm-modules.md'
  };

function ExportNodeModules(options) {
  this.options = Object.assign({}, defaultOptions, options);
}

ExportNodeModules.prototype.apply = function(compiler) {
  compiler.plugin('emit', (compilation, callback) => {
    let npmModulesList = '',
      npmModules = new Map();

    compilation.chunks.forEach(chunk => {
      if(this.options.chunkName && this.options.chunkName !== chunk.name) {
        return;
      }

      // exclude anything that isn't a node module
      chunk.modules
        .filter(module =>
          module.context && module.context.indexOf('node_modules') !== -1)
        .forEach(function(module) {
          const contextArray = module.context.split('/');

          contextArray.splice(contextArray.indexOf('node_modules') + 2);

          try {
            let context = contextArray.join('/'),
              npmModule = contextArray[contextArray.indexOf('node_modules') + 1],
              packageJsonFile = path.join(context, 'package.json'),
              packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'UTF-8'));

            npmModules.set(packageJson.name, {
              name: packageJson.name,
              version: packageJson.version,
              homepage: packageJson.homepage,
              license: getLicenses(packageJson)
            });
          } catch (err) {
            // ignore errors if package.json didn't exist for this module
            if (err.code !== 'ENOENT') {
              throw err;
            }
          }
        });
    });

    Array.from(npmModules.keys())
      .sort()
      .map(key => npmModules.get(key))
      .forEach(module => {
        npmModulesList += `[${module.name}@${module.version}: ` +
          `${module.license}](${module.homepage})  \n`;
      });

    // Insert this list into the Webpack build as a new file asset:
    compilation.assets[this.options.outputFile] = {
      source: function() {
        return npmModulesList;
      },
      size: function() {
        return npmModulesList.length;
      }
    };

    callback();
  });
};

module.exports = ExportNodeModules;

/**
 * Extracts and returns the license/licenses abbrevations
 * from the respective fields.
 * @param  {Object} packageJson The package.json file content as object.
 * @return {String}
 */
function getLicenses(packageJson) {
  if (packageJson.licenses && packageJson.licenses instanceof Array) {
    return packageJson.licenses
      .map(license => license.type)
      .join(', ');
  } else if (packageJson.licenses) {
    // TODO: Refactor this to reduce duplicate code. Note "licenses" vs "license".
    return (packageJson.licenses && packageJson.licenses.type) ||
      packageJson.licenses;
  }

  return (packageJson.license && packageJson.license.type) ||
    packageJson.license;
}
