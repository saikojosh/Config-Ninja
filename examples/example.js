'use strict';

/*
 * EXAMPLE
 * An example for how to use Config-Ninja.
 */

/* eslint no-console: 0 */

// Ensure we always work relative to this script.
process.chdir(__dirname);

// Prepare the ninja on application load.
const configInModuleA = require(`../configNinja`).init(`my-config`);

// In another module we need config again...
const configInModuleB = require(`../configNinja`).use(`my-config`);

console.log(`Config:`, configInModuleA);
console.log(`\nNested Number: ${configInModuleB.nested.number}\n`);
console.log(`Plain:`, configInModuleA.__plain());
