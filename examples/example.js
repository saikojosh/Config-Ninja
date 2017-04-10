'use strict';

/*
 * EXAMPLE
 * An example for how to use Config-Ninja.
 */

// Prepare the ninja on application load.
const configInModuleA = require('../configNinja').init(__dirname + '/cfg', null, {
  additionalMergeFiles: ['local'],
  absolutePath: true,
});

// In another module we need config again...
const configinModuleB = require('../configNinja');

// Use our config.
console.dir(configinModuleB);
console.log('Nested Number:', configinModuleB.nested.number);
