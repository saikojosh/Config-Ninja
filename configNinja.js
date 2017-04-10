'use strict';

/*
 * CONFIG-NINJA
 */

const ME = module.exports;
const fs = require('fs');
const path = require('path');
const clc = require('cli-color');
const extender = require('object-extender');
const objectAssignDeep = require('object-assign-deep');

/*
 * Loads in a config file and converts it to a JSON string ready for parsing, whilst handling errors.
 */
const readConfigFile = function (type, name, dir, absolutePath, configInFilename, ignoreMissing) {

  let filename = path.join(dir, `${name}${configInFilename ? '.config' : ''}.json`);
  let cfg;

  // If the user is not passing in an absolute path to the config then we use the current working directory.
  if (!absolutePath) { filename = path.join(process.cwd(), filename); }

  try {
    cfg = fs.readFileSync(filename).toString();
  } catch (err) {
    if (!ignoreMissing) {
      throw new Error(clc.redBright(`Unable to read ${type} config "${name}" (${err.code}) from path "${filename}".`));
    }
  }

  return cfg || null;

};

/*
 * Takes a JSON string and returns a nicely formatted config object, whilst handling errors.
 */
const parseConfigJSON = function (type, name, input) {

  let output;

  try {
    output = JSON.parse(input);
  } catch (err) {
    throw new Error(clc.redBright(`The ${type} config "${name}" is not valid JSON (${err.name}).`));
  }

  return output;

}

/*
 * Load and merge the config files synchronously.
 */
ME.init = function (dir, env, _options) {

  // Default options.
  let options = extender.defaults({
    configInFilename: true,
    setEnvProperty: { 'production': 1, 'staging': 2, 'development': 3 },
    additionalMergeFiles: [],
    ignoreMissingAdditional: true,
    absolutePath: false,
    returnCopy: false,
  }, _options);

  // If no dir is specified assume we are reloading.
  if (!dir) {
    dir = ME._cfgPath;
    if (!env) { env = ME._env; }
    options = extender.defaults(ME._options, _options);
  }

  // Which environment are we operating in?
  if (!env) { env = process.env.NODE_ENV || 'development'; }

  const configList = [];
  let prodCfg;
  let envCfg;
  let merged;

  // Prepare the production config.
  prodCfg = readConfigFile('production', 'production', dir, options.absolutePath, options.configInFilename);
  prodCfg = parseConfigJSON('production', 'production', prodCfg);

  // Load the environment config?
  if (env !== 'production') {
    envCfg = readConfigFile('environment', env, dir, options.absolutePath, options.configInFilename);
    envCfg = parseConfigJSON('environment', env, envCfg);
  }

  // Add in our internal properties.
  const defaults = {
    _env: env,
    _cfgPath: dir,
    _options: options,
  };

  // Prepare the list of config objects.
  configList.push(defaults, prodCfg, envCfg);

  // Do we have any additional files to merge in?
  if (options.additionalMergeFiles && options.additionalMergeFiles.length) {

    for (var a = 0, alen = options.additionalMergeFiles.length; a < alen; a++) {
      const additionalMergeFile = options.additionalMergeFiles[a];
      let addCfg;

      // Attempt to load in the config file.
      addCfg = readConfigFile('additional', additionalMergeFile, dir, options.absolutePath, options.configInFilename, options.ignoreMissingAdditional);
      if (!addCfg) { continue; }

      // JSONify.
      addCfg = parseConfigJSON('additional', additionalMergeFile, addCfg);

      // Store the additional config ready for merging.
      configList.push(addCfg);
    }

  }

  // Merge the configs together.
  merged = extender.merge.apply(extender, configList);

  // Add the env properties?
  if (options.setEnvProperty && !merged.env) {
    const environmentLevels = (typeof options.setEnvProperty === 'object' ? options.setEnvProperty : null);
    merged.env = {
      id: env,
      level: (environmentLevels && typeof environmentLevels[env] !== 'undefined' ? environmentLevels[env] : null),
    };
  }

  // Drop out here if we just need to return a copy of the config.
  if (options.returnCopy) { return merged; }

  // Copy the configs onto the 'config-ninja' object.
  objectAssignDeep(ME, merged);

  // Allow immediate use of 'config'.
  return ME;

};

/*
 * Returns a temporary copy of the given config.
 */
ME.get = function (useEnv, raw) {

  // Must initialise the config first.
  if (!ME._env) { throw new Error('Config has not been initialised yet.'); }

  let useOptions = extender.defaults(ME._options, {
    returnCopy: true,
  });

  // Return just a single file without merging it.
  if (raw) {
    let rawCfg;

    // Prepare the config.
    rawCfg = readConfigFile('raw', env, useOptions, dir, useOptions.absolutePath, useOptions.configInFilename);
    rawCfg = parseConfigJSON('raw', env, rawCfg);
    return rawCfg;
  }

  // Return a copy of the given config.
  return ME.init(ME._cfgPath, useEnv, useOptions);

};
