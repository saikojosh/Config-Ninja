# Config-Ninja
A quick and easy way to read in config files from disk depending on the environment. By default Config Ninja uses the `NODE_ENV` environment variable to determine whether we are running in `production` mode, otherwise `development` mode is assumed.

Once your config has been initialised Config-Ninja allows you to `const config = require('config-ninja');` in any of your modules and get access to your config object.

**Important:** The `production` config is always the default config. If you specify another environment, Config Ninja will copy the properties from that environment into the production config, overwriting any values that already exist. Nested properties will be respected. No changes are saved to disk.

## Quick Start
Create a directory to hold your config files and create a `production.config.json` file which will contain all your configuration. Then create a `development.config.json` file which will hold config _specific_ to your development environment. Then in your `index.js`:

```javascript
// Prepare the ninja on application load.
const config = require('config-ninja').init('/path/to/cfg/dir/');

// In another module we need config again...
const config = require('config-ninja');

// Use our config.
console.dir(config);
console.log('Nested Number:', config.nested.number);  // See examples.
```

See `example.js` for a working example.

## Setup Config Files
You will need at least 2 config files, one for `production` and one for `development`. You may also want config files for other environments such as `staging`. You can have as many files as you need.

```
/myConfig
  /production.config.json
  /staging.config.json
  /development.config.json
  /custom.config.json
```

## Override the Environment
By default `production` and `development` environment strings are understood. If you have additional environments you can override the environment string by passing in a second parameter `env`:
```javascript
const config = require('config-ninja').init('/path/to/cfg/dir/', 'staging');
```
Where `env` matches the name of your config file e.g. `staging.config.json`.

## Specify Extra Options
You can also specify some options when instantiating Config-Ninja. All options are optional.

```javascript
const config = require('config-ninja').init('/path/to/cfg/dir/', 'development', { ... });
```

```javascript
// Pass in null as the second parameter to default to the NODE_ENV variable.
const config = require('config-ninja').init('/path/to/cfg/dir/', null, { ... });
```

| Property                | Default | Description |
|-------------------------|---------|-------------|
| configInFilename        | true    | Set false if you want to your config filenames to be in the format of `development.json` instead of the default `development.config.json`. |
| additionalMergeFiles[]  | []      | Specify a list of other filenames to merge into your config, if the files don't exist they will just be ignored. Properties in additional files will overwrite properties with the same name in your config. |
| ignoreMissingAdditional | true   | By default we don't throw an error if an additional config file is missing. |
| absolutePath            | false  | Set true if passing in an absolute directory path to `.init()`. |

## Get a Different Config
To return a copy of a different config (perhaps for temporary use) call the `get` method. Config-Ninja must have been initialised somewhere before you do this.
```javascript
const config = require('config-ninja').init('/path/to/cfg/dir/', 'production');

const useConfig = config.get('staging');  // Returns a prepared copy of the staging config.
const useConfig = config.get('development', true);  // Pass true as the 2nd param to return just the raw file as JSON.
```

## Reserved Property Names
All these property names are reserved by Config-Ninja and cannot be used in the root of your config files. You can however use them as sub properties.

* init
* get
* \_env
* \_cfgPath
* \_options

## FAQ

#### How can I tell the environment my config was initialised with?
The environment string for a given config variable is stored under `config._env`, so you can simply do `if (config._env === 'production') { ... }`. **Warning:** If any of your config files contain a property called `_env` this will not work.

#### How can I reload my config?
Simply call `config.init()` again without any parameters and your config files will be read from disk. **Warning:** Your config files must not contain any of the reserved property names in order for this to work.

#### How can I change the environment of my config during runtime?
Call `config.init(null, 'new-environment-string');` This will reload the config with the new environment set.

#### How can I change the additional merge files of my config during runtime?
Call `config.init(null, null, { additionalMergeFiles: [ ... ] });` This will reload the config with your new additional merge files.

#### Can I load config from a database?
No. That's beyond the scope of this module.
