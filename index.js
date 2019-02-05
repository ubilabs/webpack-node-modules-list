"use strict";

const path = require("path"),
  fs = require("fs"),
  defaultOptions = {
    outputFile: "npm-modules",
    format: "markdown"
  };


function* capitlizeFirstLetter(str) {
  for (let [i, l] of Array.from(str).entries()) {
    yield (i === 0) ? l.toUpperCase() : l;
  }
}

function* capitalizeWordsArray(rest) {
  for (let word of rest) {
    yield* capitlizeFirstLetter(word);
  }
}

function kebbabCase2CamelCase(str) {
  const strArr = str.split("-");
  if (strArr.length < 2) return str;
  let [first, ...rest] = strArr;
  const restGen = capitalizeWordsArray(rest);
  return [first, ...restGen].join("");
}

function compatAddPlugin(tappable, pluginName, hookName, callback, async = false, forType = null) {
  const method = (async) ? "tapAsync" : "tap";
  if (tappable.hooks) {
    hookName = kebbabCase2CamelCase(hookName);
    if (forType) {
      tappable.hooks[hookName][method](forType, pluginName, callback);
    } else {
      tappable.hooks[hookName][method](pluginName, callback);
    }
  } else {
    tappable.plugin(hookName, callback);
  }
}

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
    .join(", ");
  } else if (packageJson.licenses) {
    // TODO: Refactor this to reduce duplicate code. Note "licenses" vs "license".
    return (packageJson.licenses && packageJson.licenses.type) ||
      packageJson.licenses;
  }

  return (packageJson.license && packageJson.license.type) ||
    packageJson.license;
}

class ExportNodeModules {
  constructor(options) {
    this.options = Object.assign({}, defaultOptions, options);
  }

  apply(compiler) {
    compatAddPlugin(compiler, ExportNodeModules.name, "emit", (compilation, callback) => {
      let npmModulesList = "",
        npmModules = new Map(),
        npmModulesJsonList = [],
        extension;

      compilation.chunks.forEach(chunk => {
        if (chunk.modulesIterable instanceof Set === false || (this.options.chunkName && this.options.chunkName !== chunk.name)) {
          return;
        }

        let chunkModules = chunk.getModules ? chunk.getModules() : chunk.modules;
        for (let module of chunkModules) {
          // exclude anything that isn't a node module
          if (module.context && module.context.indexOf("node_modules") !== -1) {
            const contextArray = module.context.split(path.sep);
            const packageNameStart = contextArray.indexOf("node_modules") + 1;
            const nodeModulesArray = contextArray.slice(0, packageNameStart);
            const firstPackageName = contextArray.slice(packageNameStart, packageNameStart + 1)[0];
            const packageNameEnd = packageNameStart + (firstPackageName.indexOf("@") ? 1 : 2); //scoped packages

            const packageName = contextArray.slice(packageNameStart, packageNameEnd);

            const packageJsonFile = path.join(...nodeModulesArray, ...packageName, "package.json");
            let packageJson;
            try {
              packageJson = JSON.parse(fs.readFileSync(packageJsonFile, "UTF-8"));
            } catch {
              console.warn(`could not read and parse package.json for package ${packageName}`);
              continue;
            }
            npmModules.set(packageJson.name, {
              name: packageJson.name,
              version: packageJson.version,
              homepage: packageJson.homepage,
              license: getLicenses(packageJson)
            });
          }
        }
      });

      Array.from(npmModules.keys())
      .sort()
      .map(key => npmModules.get(key))
      .forEach(module => {
        if (this.options.format === "markdown") {
          npmModulesList += `[${module.name}@${module.version}: ` +
            `${module.license}](${module.homepage})  \n`;
          extension = "md";
        } else if (this.options.format === "json") {
          npmModulesJsonList.push({
            name: module.name,
            type: module.license,
            version: module.version,
            source: module.homepage
          });
          npmModulesList = JSON.stringify(npmModulesJsonList, null, 2);
          extension = "json";
        } else {
          throw new Error(`Format "${this.options.format}" is not supported by webpack-node-modules-list.`);
        }
      });


      // Insert this list into the Webpack build as a new file asset:
      compilation.assets[`${this.options.outputFile}.${extension}`] = {
        source: function() {
          return npmModulesList;
        },
        size: function() {
          return npmModulesList.length;
        }
      };

      callback();
    }, true);
  };
}

module.exports = ExportNodeModules;

