'use strict';

const fileSystem = require(`fs`);
const path = require(`path`);
const deepProperty = require(`deep-property`);
const dotenv = require(`dotenv`);
const extender = require(`object-extender`);
const ConfigError = require(`./configError`);

module.exports = class ConfigBuilder {

	/*
	 * Instantiate a new config instance.
	 */
	constructor (configId, dir = null, env = null, _options = null) {
		this.init(configId, dir, env, _options);
	}

	/*
	 * Returns an absolute path to the config directory. If the user is not passing in an absolute path to the config then
	 * we use the current working directory as the base for the config directory path.
	 */
	prepareAbsoluteDirPath (_dir, defaultDir) {
		const dir = _dir || defaultDir;
		return (path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir));
	}

	/*
	 * Initialise the config.
	 */
	init (configId, dir = null, env = null, options = null) {

		if (!configId) { throw new ConfigError(`You must provide a valid config id!`); }

		const defaultOptions = {
			dir: this.prepareAbsoluteDirPath(dir, `./config`),
			env: env || process.env.NODE_ENV || `development`,
			shortFilenames: false,
			environmentLevels: { production: 1, staging: 2, development: 3 },
			localConfig: [ `local` ],
			requireLocalConfig: false,
			environmentVariables: {
				enableDotenv: false,
				dotenvPath: null, // <- Use default path chosen by 'dotenv' module.
				mapping: {},
			},
			single: null,
			immutable: false, // <- Not used in this class but listed here for completeness.
			plain: false, // <- Not used in this class but listed here for completeness.
		};

		// Set the builder's configuration.
		this.configId = configId;
		this.options = extender.defaults(defaultOptions, options);
		this.meta = {
			loadedOn: 0,
			loadedFiles: [],
		};
		this.rawFiles = {};
		this.configValues = {};

		// Ensure the localConfig option doesn't have any duplicates.
		if (Array.isArray(this.options.localConfig)) {
			this.options.localConfig = Array.from(new Set(this.options.localConfig));
		}

		// (Re)-load all the configuration.
		this.loadFiles();
		this.mapVariablesFromEnvironment();

	}

	/*
	 * Loads in variables from the environment, and optionally a dotenv file.
	 */
	mapVariablesFromEnvironment () {

		// Skip or continue?
		if (!this.options.environmentVariables || !Object.keys(this.options.environmentVariables.mapping).length) {
			return;
		}

		// Handle dotenv file.
		if (this.options.environmentVariables.enableDotenv) {
			const dotenvPath = this.options.environmentVariables.dotenvPath || void (0);
			const dotenvResult = dotenv.config({ path: dotenvPath });
			if (dotenvResult.error) { throw new ConfigError(dotenvResult.error); }
		}

		// Handle variable mappings.
		for (const envVarName of this.options.environmentVariables.mapping) {
			if (envVarName === `NODE_ENV`) { continue; }
			const configPath = this.options.environmentVariables.mapping[envVarName];
			const envVarValue = this.parseEnvironmentValue(process.env[envVarName]);
			deepProperty.set(this.configValues, configPath, envVarValue);
		}

	}

	/*
	 * Converts string representations of true, null, false, integers and floats to their correct data types.
	 */
	parseEnvironmentValue (inputStr) {

		// We can only parse strings!
		if (typeof inputStr !== `string`) { return inputStr; }

		switch (inputStr.toLowerCase()) {
			case `true`: return true;
			case `null`: return null; // eslint-disable-line node/no-unsupported-features/es-syntax
			case `false`: return false;
			default:
				if (inputStr.match(/^\d+(?:\.\d+)?$/)) { return parseFloat(inputStr); }
				break;
		}

		// Nothing to do so return the value as-is.
		return inputStr;

	}

	/*
	 * Read and parse all the config files.
	 */
	loadFiles () {

		const mergeList = [];
		const files = [];

		// Single config mode.
		if (this.options.single) {

			// Load just one config file.
			files.push({ type: `single`, filename: this.options.single });

		}

		// Multiple config mode.
		else {

			// Add the production config first.
			files.push({ type: `production`, filename: `production` });

			// Then add the environent's config, if it isn't also the production config.
			if (this.options.env !== `production`) {
				files.push({ type: this.options.env, filename: this.options.env });
			}

			// Add the additional local files to the files list, if any.
			if (Array.isArray(this.options.localConfig)) {
				this.options.localConfig.forEach(filename => files.push({ type: `local`, filename }));
			}

		}

		// Parse each config file in order.
		files.forEach(file => {

			// Load the next file.
			const json = this.readConfigFile(file.type, file.filename);
			if (!json) { return; }

			// Parse and save the values.
			const values = this.parseConfigJson(file.type, file.filename, json);
			this.rawFiles[file.filename] = values;
			mergeList.push(values);

		});

		// Generate the config by merging it all together in order.
		this.configValues = extender.merge(...mergeList);

		// Automatically add the environment information to the config if 'env' isn't used for something else.
		if (!this.configValues.env && this.options.environmentLevels) {
			/* eslint id-length: 0 */
			this.configValues.env = {
				id: this.options.env,
				level: this.options.environmentLevels[this.options.env] || `-not set-`,
			};
		}

		// Update the meta data.
		this.meta.loadedOn = Date.now();
		this.meta.loadedFiles = files;

	}

	/*
	 * Loads in a config file and converts it to a JSON string ready for parsing, whilst handling errors.
	 */
	readConfigFile (type, filename) {

		const fullFilename = path.join(this.options.dir, `${filename}${this.options.shortFilenames ? `` : `.config`}.json`);
		let json;

		try {
			json = fileSystem.readFileSync(fullFilename).toString();
		}
		catch (err) {
			if (type !== `local` || (type === `local` && this.options.requireLocalConfig)) {
				const errInfo = err.id || err.code || err.name;
				throw new ConfigError(`Unable to read ${type} config "${filename}" from path "${fullFilename}" (${errInfo}).`);
			}
		}

		return json || null;

	}

	/*
	 * Takes a JSON string and returns a nicely formatted config object, whilst handling errors.
	 */
	parseConfigJson (type, filename, json) {

		let output;

		try {
			output = JSON.parse(json);
		}
		catch (err) {
			const errInfo = err.id || err.code || err.name;
			throw new ConfigError(`The ${type} config "${filename}" is not valid JSON (${errInfo}).`);
		}

		return output;

	}

	/*
	 * Returns a copy of the merged config.
	 */
	getValues () {
		return extender.clone(this.configValues);
	}

	/*
	 * Returns a copy of the options used to construct this instance of the config.
	 */
	getOptions () {
		return extender.clone(this.options);
	}

	/*
	 * Returns a copy of the meta information for this instance of the config.
	 */
	getMeta () {
		return extender.clone(this.meta);
	}

	/*
	 * Returns a copy of all the raw config files as they were when loaded.
	 */
	getRaw () {
		return extender.clone(this.rawFiles);
	}

};
