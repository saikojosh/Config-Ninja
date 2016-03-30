'use strict';

/*
 * An example for using Config-Ninja.
 */

// Prepare the ninja on application load.
const config = require('../configNinja').init(__dirname + '/cfg');

// In another module we need config again...
const config = require('../configNinja');

// Use our config.
console.dir(config);
console.log('Super:', config.nested.number);
