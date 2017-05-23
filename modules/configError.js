'use strict';

/*
 * CONFIG ERROR
 * Generates a new error in a red font.
 */

const clc = require(`cli-color`);

module.exports = class ConfigError extends Error {

	constructor (message) {
		const part1 = clc.redBright.bold.underline(`Config-Ninja:`);
		const part2 = clc.redBright(message);
		super(`${part1} ${part2}`);
	}

};
