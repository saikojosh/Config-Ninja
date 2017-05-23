# Config-Ninja
A quick and easy way to read in config files from disk depending on the environment. By default Config Ninja uses the `NODE_ENV` environment variable to determine whether we are running in `production` mode, `staging`, or any other environment, otherwise `development` mode is assumed.

Once your config has been initialised Config-Ninja allows you to `const config = require('config-ninja').use('my-config');` in any of your modules and get access to your config object.

**Important:** The `production` config is always the default config. If you specify another environment such as `staging` or `development`, Config Ninja will deep merge the properties from that environment into the production config, overwriting any values that already exist. You can nest properties as deeply as you like. No changes are persisted to disk.

## Quick Start
Create a directory to hold your config files and create a `production.config.json` file which will contain all your configuration properties. Then create a `development.config.json` file which will hold only the _specific_ values that need to be different in your development environment. Then in your application entry point, e.g. `index.js`:

```javascript
// Prepare the ninja on application load.
const config = require('config-ninja').init('my-config', '/path/to/cfg/dir/');
```

To load the config in other modules:
```javascript
// Load in the config again, taking advantage of Node's module caching.
const config = require('config-ninja').use('my-config');

// Use the config!
console.dir(config);
console.log('Nested Number:', config.nested.number);  // See examples.
```

**Example:** See `example.js` for a working example which you can run with `node ./examples/example`.

## Setup your Config Files
You will need at least 2 config files, one for `production` and one for `development`. You may also want config files for other environments such as `staging`. You can have as many files as you need.

```
/myConfig
  /production.config.json
  /staging.config.json
  /development.config.json
  /custom.config.json
```

## Local Config
You may also wish to add local config files that are not committed to your repo but must be present on every developer's machine e.g. `local.config.json`. Use the ignore rules for your VCS (e.g. `.gitignore`) to ignore the local files and prevent them from being committed.

By default we assume you might have a local file called `local.config.json`. You can change this by passing in an array of names in the `localConfig` option. If you want to throw an error if any of the specified local config files are missing then set the `requireLocalConfig` option to true.

```javascript
// Default options for local config.
const config = require('config-ninja').use('my-config', {
  localConfig: ['local'],
  requireLocalConfig: false,
});
```

## Override the Environment
By default `production` and `development` environment strings are understood. If you have additional environments you can override the environment string by passing in a third parameter called `env`, which matches the name of your config file (e.g. `staging.config.json`):
```javascript
const config = require('config-ninja').init('my-config', '/path/to/cfg/dir/', 'staging');
```

## Specify Extra Options
You can also specify some options when instantiating Config-Ninja. All options are optional.

```javascript
const config = require('config-ninja').init('/path/to/cfg/dir/', 'development', { ... });
```

```javascript
// Pass in null as the second parameter to default to the NODE_ENV variable.
const config = require('config-ninja').init('/path/to/cfg/dir/', null, { ... });
```



## Get a Different Config
To return a copy of a different config (perhaps for temporary use) call the `get` method. Config-Ninja must have been initialised somewhere before you do this.
```javascript
const config = require('config-ninja').init('/path/to/cfg/dir/', 'production');

const useConfig = config.get('staging');  // Returns a prepared copy of the staging config.
const useConfig = config.get('development', true);  // Pass true as the 2nd param to return just the raw file as JSON.
```

## Reserved Property Names
Properties in the top level of your config that begin with two underscores (i.e. `__reload`) are reserved names and should not be used as config properties.

## API Overview

### .init(configId, dir = './config', env = process.env.NODE_ENV, options = null)
Sets up a new config object and returns it. Any of the following function signatures are acceptable:

* `.init(configId)`
* `.init(configId, dir)`
* `.init(configId, dir, env)`
* `.init(configId, dir, env, options)`
* `.init(configId, dir, options)`
* `.init(configId, options)`

You can specify the following options. You can either pass `dir` and `env` into the function, or add them as options, or rely on the default values.

| Option                  | Default              | Description |
|-------------------------|----------------------|-------------|
| dir                     | `./config`           | Set the directory where your config is stored. Relative paths are relative to the current working directory of your process. |
| env                     | process.env.NODE_ENV | Set the environment to a specific environment string (e.g. "production"), defaults to process.env.NODE_ENV or "development". |
| shortFilenames          | false                | Set true if you want to your config filenames to be in the format of `development.json` instead of the default `development.config.json`. |
| environmentLevels       | `{ production: 1, staging: 2, development: 3 }` | If the property `env` is not already specified in your config files this option will set `env.id` to the environment string (e.g. "production"), and will set `env.level` to the corresponding integer specified in this option. Pass in a falsy value to disable this feature. |
| localConfig[]           | [`local`]            | Specify a list of other filenames to merge into your config, if the files don't exist they will just be ignored by default. Properties in local files will overwrite properties with the same name in your config. |
| requireLocalConfig      | false                | By default we don't throw an error if an additional config file is missing. Set true to throw an error instead. |
| immutable               | false                | Set true to force the config objects to always be immutable. |
| plain                   | false                | Set true to always construct the config without any of the utility functions attached. |

### .use(configId, immutable = false, plain = false)
Return an existing config object that has been initialised with `.init()`. You can pass true as the second parameter to return a copy of the config, which prevents accidental changes to the config from propagating through to other modules. This has no affect if the `immutable` option was passed to `.init()` as true. You can also pass true as the third parameter if you wish to return a plain copy of the config without the utility functions attached. This has no affect if the `plain` option was passed to `.init()`.

### .wipe(configId)
This will remove the config from memory, allowing you to re-use an existing config id. This will NOT prevent other parts of your application from continuing to use the config if they have already got a copy from `.use()`.

## Config Overview

### config.\_\_inspect()
Returns information about the config object, including some meta data and the options used to initialise the config in `.init()`.

### config.\_\_reload()
Reloads the config files from disk, using the original options passed to `.init()`. Returns the reloaded config, and if the `immutable` option was not set it will also mutate the config object itself. **Warning:** This operation is synchronous and blocking.

### config.\_\_switch(env)
Reloads the config files from disk and switches to the new environment specified, using the original options passed to `.init()`. Returns the new config, and if the `immutable` option was not set it will also mutate the config object itself. **Warning:** This operation is synchronous and blocking.

### config.\_\_addLocal(localConfig)
Reloads the config using the original options passed to `.init()`, but adds in the extra specified local files. Returns the reloaded config, and if the `immutable` option was not set it will also mutate the config object itself. **Warning:** This operation is synchronous and blocking.

### config.\_\_get(env)
Loads and prepares the config for the specified environment, without actually modifying the existing config. Returns the result without mutating the existing config. **Warning:** This operation is synchronous and blocking.

### config.\_\_raw(env)
Returns the raw JSON from the config file for the specified environment (from memory). Does not do any merging and does not mutate the existing config.

### config.\_\_plain()
Returns a copy of the config without any of the utility functions attached.

### config.\_\_trace()
Returns a stack trace for when the config was initialised as an array of strings. Can be used for debugging to see which module instantiated the config.

## FAQ

#### How can I tell which environment string my config was initialised with?
By default, the `env.id` property will be set inside your config. If you have manually specified `env` in your config or the feature has been disabled (by setting the `localConfig` option) you can use the `config.__inspect()` method:

```javascript
const inspection = config.__inspect();
console.log(inspection.options.env);
```

#### How can I reload my config from disk?
Simply call `config.__reload()`. See the Config Overview above.

#### How can I change the environment of my config after initialisation?
Call `config.__switch(env)`. This will reload the config with the new environment set. See the Config Overview above.

#### How can I load in additional config files from disk after initialisation?
Call `config.__addLocal(localConfig)` and pass in an array of local config files to load. This will reload the config with the extra config files merged in. See the Config Overview section above.

#### How can I create a code branch that executes on multiple environments?
See the `localConfig` initilisation option. If your config files do not include a property called `env` then Config-Ninja will add in a property with this shape by default:
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
