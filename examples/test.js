/*
 * An example for using Config Ninja.
 */

// On application load prepare the ninja.
var config = require('../configNinja').init(__dirname + '/cfg');

// In another module we need config again...
var config = require('../configNinja');

// Use our config.
console.dir(config);