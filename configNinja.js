'use strict';

/*
 * Config Ninja.
 */

const ME = module.exports;
const fs = require('fs');
const path = require('path');
const extender = require('object-extender');
const objectAssignDeep = require('object-assign-deep');

/*
 * Loads in a config file and converts it to a JSON string ready for parsing, whilst handling errors.
 */
const readConfigFile = function (type, name, dir, configInFilename) {

  const filename = path.join(dir, `${name}${configInFilename ? '.config' : ''}.json`);
  let cfg;

  try {
    cfg = fs.readFileSync(filename).toString();
  } catch (err) {
    throw new Error(`Unable to read ${type} config "${name}" (${err.code}).`);
  }

  return cfg;

};

/*
 * Takes a JSON string and returns a nicely formatted config object, whilst handling errors.
 */
const parseConfigJSON = function (type, name, input) {

  let output;

  try {
    output = JSON.parse(input);
  } catch (err) {
    throw new Error(`The ${type} config "${name}" is invalid (${err.name}).`);
  }

  return output;

}

/*
 * Load and merge the config files synchronously.
 */
ME.init = function (dir, env, _options) {

  // Default options.
  const options = extender.defaults({
    configInFilename: true,
    additionalMergeFiles: [],
  }, _options);

  // If no dir is specified assume we are reloading.
  if (!dir) {
    dir = ME._cfgPath;
    if (!env) { env = ME._env; }
  }

  // Which environment are we operating in?
  if (!env) { env = process.env.NODE_ENV || 'development'; }

  const configList = [];
  let prodCfg;
  let envCfg;
  let merged;

  // Prepare the production config.
  prodCfg = readConfigFile('production', 'production', dir, options.configInFilename);
  prodCfg = parseConfigJSON('production', 'production', prodCfg);

  // Load the environment config?
  if (env !== 'production') {
    envCfg = readConfigFile('environment', env, dir, options.configInFilename);
    envCfg = parseConfigJSON('environment', env, envCfg);
  }

  // Set an 'env' property on the config but allow it to be overridden by any config file.
  const defaults = {
    _env: env,
    _cfgPath: dir,
  };

  // Prepare the list of config objects.
  configList.push(defaults, prodCfg, envCfg);

  // Do we have any additional files to merge in?
  if (options.additionalMergeFiles && options.additionalMergeFiles.length) {

    for (var a = 0, alen = options.additionalMergeFiles.length; a < alen; a++) {
      const additionalMergeFile = options.additionalMergeFiles[a];
      let addCfg;

      addCfg = readConfigFile('additional', additionalMergeFile, dir, options.configInFilename);
      addCfg = parseConfigJSON('additional', additionalMergeFile, addCfg);

      // Store the additional config ready for merging.
      configList.push(addCfg);
    }

  }

  // Merge the configs together.
  merged = extender.merge.apply(extender, configList);

  // Copy the configs onto the 'config-ninja' object.
  objectAssignDeep(ME, merged);

  // Allow immediate use of 'config'.
  return ME;

};
