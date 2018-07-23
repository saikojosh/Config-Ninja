'use strict';

/*
 * CONFIG-NINJA
 */

const stackTrace = require(`stack-trace`);
const extender = require(`object-extender`);
const ConfigBuilder = require(`./modules/configBuilder`);
const ConfigError = require(`./modules/configError`);

const utilityFunctions = {
	'__inspect': __inspect,
	'__reload': __reload,
	'__switch': __switch,
	'__addLocal': __addLocal,
	'__get': __get,
	'__raw': __raw,
	'__plain': __plain,
	'__trace': __trace,
};
const utilityFunctionNames = Object.keys(utilityFunctions);

const configCache = {};

/*
 * Utility function to the return the options used to construct the config and its meta information.
 */
function __inspect (object) {

	return {
		options: extender.clone(object.options),
		meta: extender.clone(object.meta),
	};

}

/*
 * Reload the existing config and return the result. If the immutable option is not set, the original config object will
 * be mutated.
 */
function __reload (object) {
	return prepareConfig(object.configId, null, null, object.options);
}

/*
 * Switch the config to a new environment and return the result. If the immutable option is not set, the original config
 * object will be mutated.
 */
function __switch (object, env) {

	if (!env) { throw new ConfigError(`You must specify an environment to switch to.`); }

	const newOptions = extender.merge(object.options, { env });
	return prepareConfig(object.configId, null, null, newOptions);

}

/*
 * Reload the existing config and return the result, adding in the extra local config files specified. If the immutable
 * option is not set, the original config object will be mutated.
 */
function __addLocal (object, _localConfig) {

	const localConfig = (typeof _localConfig === `string` ? [ _localConfig ] : _localConfig);

	if (!Array.isArray(localConfig)) { throw new ConfigError(`You must specify an array of local config files to add.`); }

	const newOptions = extender.merge(object.options, { localConfig: localConfig.concat(localConfig) });
	return prepareConfig(object.configId, null, null, newOptions);

}

/*
 * Gets the specified environment's config as if that were the new environment and return the result. Does not modify
 * the existing config.
 */
function __get (object, env) {

	if (!env) { throw new ConfigError(`You must specify an environment to get.`); }

	const newOptions = extender.merge(object.options, { env });
	return prepareConfig(object.configId, null, null, newOptions, true);

}

/*
 * Utiliy function to return the raw config values for the given environment before they were merged in.
 */
function __raw (object, env) {

	// If no environment is specified return all the raw files in a hash.
	if (!env) { return extender.clone(object.raw); }

	if (!object.raw[env]) { throw new ConfigError(`There is no config loaded called "${env}".`); }

	return extender.clone(object.raw[env]);
}

/*
 * Returns a copy of the config properties without any of the utility functions added in.
 */
function __plain (object) {
	return use(object.configId, object.options.immutable, true);
}

/*
 * Utility function to return the trace of the stack that initialised the config.
 */
function __trace (object) {
	return Array.from(object.trace);
}

/*
 * Handle the different function signatures for .init().
 */
function initParameterSwitching (param2, param3, param4) {

	let dir = null;
	let env = null;
	let options = null;

	// .init(configId, dir, env, options);
	if (typeof param2 !== `undefined` && typeof param3 !== `undefined` && typeof param4 !== `undefined`) {
		dir = param2;
		env = param3;
		options = param4;
	}

	// .init(configId, dir, env);
	else if (typeof param2 !== `undefined` && typeof param3 === `string` && typeof param4 === `undefined`) {
		dir = param2;
		env = param3;
	}

	// .init(configId, dir, options);
	else if (typeof param2 !== `undefined` && typeof param3 === `object` && typeof param4 === `undefined`) {
		dir = param2;
		options = param3;
	}

	// .init(configId, dir);
	else if (typeof param2 === `string` && typeof param3 === `undefined` && typeof param4 === `undefined`) {
		dir = param2;
	}

	// .init(configId, options);
	// .init(configId);
	else {
		options = param2;
	}

	return { dir, env, options: options || {} };

}

/*
 * Factory to create a new config. Can only be used once per config id.
 */
function init (configId, param2, param3, param4) {

	// We can only initialise each config id once.
	if (configCache[configId]) {
		throw new ConfigError(`The config "${configId}" already exists! Use ".use()" to obtain an immutable copy of it.`);
	}

	const { dir, env, options } = initParameterSwitching(param2, param3, param4);

	return prepareConfig(configId, dir, env, options);

}

/*
 * Creates a new config.
 */
function prepareConfig (configId, dir, env, options, returnOnly = false) {

	const builder = new ConfigBuilder(configId, dir, env, options);

	// Just returns the config values without storing the config.
	if (returnOnly) { return extender.clone(builder.getValues()); }

	// The config has previously been loaded and the immutable option is not set.
	if (configCache[configId] && !options.immutable) {

		// Remove all old properties from the config values so it's empty without destroying the values object itself.
		for (const key in configCache[configId].values) {
			if (configCache[configId].values.hasOwnProperty(key)) {
				delete configCache[configId].values[key];
			}
		}

		// Merge in the new config.
		extender.mergeInto(configCache[configId].values, builder.getValues());

		// Overwrite these with the new values (rather than merging).
		configCache[configId].options = builder.getOptions();
		configCache[configId].meta = builder.getMeta();
		configCache[configId].raw = builder.getRaw();

	}

	// Otherwise the immutable option is set, or this is the first init of the config.
	else {

		configCache[configId] = {
			configId,
			values: builder.getValues(),
			options: builder.getOptions(),
			meta: builder.getMeta(),
			raw: builder.getRaw(),
			trace: stackTrace.get().map(item => item.toString()),
		};

	}

	// Return the config.
	const immutable = options && options.immutable;
	return use(configId, immutable);

}

/*
 * Returns a copy of the config in memory.
 */
function use (configId, _immutable = false, _plain = false) {

	// Ensure the config was previously initialised.
	if (!configCache[configId]) {
		throw new ConfigError(`The config "${configId}" has not been initialised with the ".init()" method!`);
	}

	// Create a copy to make the config immutable if the immutable option is truthy.
	const object = configCache[configId];
	const immutable = object.options.immutable || _immutable || false;
	const plain = object.options.plain || _plain || false;
	const config = (immutable ? extender.clone(object.values) : object.values);

	// Plain objects should not have any of the utility functions attached.
	if (plain) {

		for (const key in config) {
			if (config.hasOwnProperty(key)) {
				if (utilityFunctionNames.includes(key)) { delete config[key]; }
			}
		}

	}

	// Otherwise we add the utility functions to the config.
	else {

		for (const key in utilityFunctions) {
			if (utilityFunctions.hasOwnProperty(key)) {
				const func = utilityFunctions[key];
				config[key] = func.bind(null, object);
			}
		}

	}

	return config;

}

/*
 * Removes an existing config, without preventing any other modules from using it if they have already obtained a copy.
 */
function wipe (configId) {

	// Ensure the config was previously initialised.
	if (!configCache[configId]) {
		throw new ConfigError(`The config "${configId}" has not been initialised with the ".init()" method!`);
	}

	delete configCache[configId];

}

/*
 * Export.
 */
module.exports = {
	init,
	use,
	wipe,
};
