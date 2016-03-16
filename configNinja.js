/*
 * Config Ninja.
 */

const ME = module.exports;
const path = require('path');
const extender = require('object-extender');
const objectAssignDeep = require('object-assign-deep');

/*
 * Load and merge the config files.
 */
ME.init = function (dir, env, _options) {

  const options = extender.defaults({
    configInFilename: true,
  }, _options);

  // If no dir is specified assume we are reloading.
  if (!dir) {
    dir = ME._cfgPath;
    if (typeof env === 'undefined') { env = ME._env; }
  }

  const prodCfg  = require(path.join(dir, 'production.config.json'));
  const defaults = {};
  let envCfg;
  let merged;

  // Get the enviroment.
  if (typeof env === 'undefined') { env = process.env.NODE_ENV || 'development'; }

  // Load the environment config?
  if (env !== 'production') {
    let filename = `${env}${options.configInFilename ? '.config' : ''}.json`;
    envCfg  = require(path.join(dir, filename));
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
