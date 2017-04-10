# Config-Ninja
A quick and easy way to read in config files from disk depending on the environment. By default Config Ninja uses the `NODE_ENV` environment variable to determine whether we are running in `production` mode, otherwise `development` mode is assumed.

Once your config has been initialised Config-Ninja allows you to `const config = require('config-ninja');` in any of your modules and get access to your config object.

**Important:** The `production` config is always the default config. If you specify another environment such as `staging` or `development`, Config Ninja will deep merge the properties from that environment into the production config, overwriting any values that already exist. You can nest properties as deeply as you like. No changes are persisted to disk.

## Quick Start
Create a directory to hold your config files and create a `production.config.json` file which will contain all your configuration. Then create a `development.config.json` file which will hold only the _specific_ values that need to be different in your development environment. Then in your application entry point, e.g. `index.js`:

```javascript
// Prepare the ninja on application load.
const config = require('config-ninja').init('/path/to/cfg/dir/');
```

To load the config in other modules:
```javascript
// Load in the config again, taking advantage of Node's module caching.
const config = require('config-ninja');

// Use the config!
console.dir(config);
console.log('Nested Number:', config.nested.number);  // See examples.
```

See `example.js` for a working example which you can run with `node ./examples/example`.

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

| Option                  | Default | Description |
|-------------------------|---------|-------------|
| configInFilename        | true    | Set false if you want to your config  filenames to be in the format of `development.json` instead of the default `development.config.json`. |
| setEnvProperty          | `{'production': 1, 'staging': 2, 'development': 3 }` | If the property `env` is not already specified in your config files this option will set `env.id` to the environment string e.g. "production", and will set `env.level` to the corresponding integer specified in this option. |
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

#### How can I tell which environment string my config was initialised with?
The environment string for a given config variable is stored under `config._env`, so you can simply do `if (config._env === 'production') { ... }`. **Warning:** If any of your config files contain a property called `_env` this will not work.

#### How can I reload my config from disk?
Simply call `config.init()` again without any parameters and your config files will be read from disk. **Warning:** Your config files must not contain any of the reserved property names in order for this to work.

#### How can I change the environment of my config after initialisation?
Call `config.init(null, 'new-environment-string');` This will reload the config with the new environment set.

#### How can I load in additional config files from disk after initialisation?
Call `config.init(null, null, { additionalMergeFiles: [ ... ] });` This will reload the config with the extra config files merged in.

#### How can I create a code branch that executes on multiple environments?
See the `setEnvProperty` initilisation option. If your config files don't include a property called `env` then Config-Ninja will add in a property with this shape:
```javascript
{
  id: "production",
  level: 1,
}

// OR
{
  id: "staging",
  level: 2,
}

// OR
{
  id: "development",
  level: 3,
}
```
You can use this to create code branches that only execute if the environment is above a certain "level". For example, the following branch will execute if the environment level is higher than 1. By default this will be either the "staging" or "development" environments.

 ```javascript
 if (config.env.level > 1) { ... }
 ```

#### Can I load config from a database?
No. That's beyond the scope of this module.
