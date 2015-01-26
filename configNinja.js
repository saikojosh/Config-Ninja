/*
 * Config Ninja.
 */

var ME               = module.exports;
var path             = require('path');
var objectAssignDeep = require('object-assign-deep');

/*
 * Load and merge the config files.
 */
ME.init = function (dir, env) {

  var prodCfg  = require(path.join(dir, 'production.config.json'));
  var defaults = {};
  var envCfg;
  var merged;

  // Get the enviroment.
  if (typeof env === 'undefined') {
    env = process.env.NODE_ENV || 'development';
  }

  // Load the environment config?
  if (env !== 'production') {
    envCfg  = require(path.join(dir, env + '.config.json'));
  }

  // Set an 'env' property on the config but allow it to be overridden by any config file.
  defaults = {
    _env:     env,
  };

  // Merge the configs together
  merged = objectAssignDeep(defaults, prodCfg, envCfg);

  // Copy the configs onto the 'config-ninja' object.
  objectAssignDeep(ME, merged);

};