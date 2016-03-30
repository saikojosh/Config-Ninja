/*
 * Config Ninja.
 */

const ME = module.exports;
const fs = require('fs');
const path = require('path');
const extender = require('object-extender');
const objectAssignDeep = require('object-assign-deep');

/*
 * Load and merge the config files synchronously.
 */
ME.init = function (dir, env, _options) {

  // Default options.
  const options = extender.defaults({
    configInFilename: true,
  }, _options);

  // If no dir is specified assume we are reloading.
  if (!dir) {
    dir = ME._cfgPath;
    if (!env) { env = ME._env; }
  }

  const prodFilename = path.join(dir, 'production${options.configInFilename ? '.config' : ''}.json');
  const prodCfg  = fs.readFileSync(prodFilename);
  const defaults = {};
  let envCfg;
  let merged;

  // Get the enviroment.
  if (!env) { env = process.env.NODE_ENV || 'development'; }

  // Load the environment config?
  if (env !== 'production') {
    let envFilename = path.join(dir, `${env}${options.configInFilename ? '.config' : ''}.json`);
    envCfg  = fs.readFileSync(envFilename);
  }

  // Set an 'env' property on the config but allow it to be overridden by any config file.
  defaults = {
    _env: env,
    _cfgPath: dir,
  };

  // Merge the configs together.
  merged = extender.merge(defaults, prodCfg, envCfg);

  // Copy the configs onto the 'config-ninja' object.
  objectAssignDeep(ME, merged);

  // Allow immediate use of 'config'.
  return ME;

};
