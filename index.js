const path = require('path'),
  fs = require('fs'),
  npmModules = new Map();

function ExportNodeModules() {}

ExportNodeModules.prototype.apply = function(compiler) {
  compiler.plugin('emit', function(compilation, callback) {
    let npmModulesList = '';

    compilation.chunks.forEach(function(chunk) {
      if (chunk.name === 'vendor') {
        chunk.modules.forEach(function(module) {
          const contextArray = module.context.split('/');

          contextArray.splice(contextArray.indexOf('node_modules') + 2);

          let packageJson = {},
            context = contextArray.join('/'),
            npmModule = contextArray[contextArray.indexOf('node_modules') + 1],
            packageJsonFile = path.join(context, 'package.json');

          if (fs.existsSync(packageJsonFile)) {
            packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'UTF-8'));
          }

          npmModules.set(packageJson.name, {
            name: packageJson.name,
            version: packageJson.version,
            homepage: packageJson.homepage,
            license: getLicenses(packageJson)
          });
        });
      }
    });

    Array.from(npmModules.keys())
      .sort()
      .map(key => npmModules.get(key))
      .forEach(module => {
        npmModulesList += `[${module.name}-${module.version}: ` +
          `${module.license}](${module.homepage})\n`;
      });

    // Insert this list into the Webpack build as a new file asset:
    compilation.assets['npm-modules.md'] = {
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
  if (packageJson.licenses) {
    return packageJson.licenses
      .map(license => license.type)
      .join(', ');
  }

  return (packageJson.license && packageJson.license.type) ||
    packageJson.license;
}
