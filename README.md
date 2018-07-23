# Config-Ninja
A quick and easy way to load in config from disk or environment variables. Config-Ninja uses the `NODE_ENV` environment variable to determine whether your code is running in `production` mode, `staging`, or any other environment, otherwise `development` mode is assumed.

Once your config has been initialised Config-Ninja allows you to `const config = require('config-ninja').use('my-config');` in any of your modules and get access to your config object.

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

## Important Notes

### Production Config
The `production` config is _always_ the default config. If you specify another environment such as `staging` or `development`, Config-Ninja will deep merge the properties from that environment into the production config, overwriting any values that already exist. You can nest properties as deeply as you like. Your files are not modified.

### Setup your Config Files
You will need at least 2 config files, one for `production` and one for `development`. You may also want config files for other environments such as `staging`. You can have as many files as you need.

```
/myConfig
  /production.config.json
  /staging.config.json
  /development.config.json
  /custom.config.json
```

### Config ID
The config id you set needs to be unique for your application or module because of the way Node caches modules in memory. It's possible that your module and another dependency will be using the same instance of Config-Ninja.

If that happens and there is a collision of config ids an error will be thrown. One way to avoid this could be to use some information from your `package.json` to set the config id like this:

```javascript
const packageJson = require(`./package.json`);
const config = require(`config-ninja`).init(`${packageJson.name}-${packageJson.version}-config`);
```

### Reserved Property Names
Properties in the top level of your config that begin with two underscores (i.e. `__reload`) are reserved names and should not be used as config properties.

## Advanced Usage

### Specify Extra Options
You can also specify some options when instantiating Config-Ninja. All options are optional and must be passed as a hash as the last parameter:

```javascript
const config = require('config-ninja').init('my-config', '/path/to/cfg/dir/', 'development', { ... });
const config = require('config-ninja').init('my-config', { ... });
```

See the API Overview below for the options you can specify.

### Local Config
You may also wish to add local config files that are not committed to your repo but must be present on every developer's machine e.g. `local.config.json`. Use the ignore rules for your VCS (e.g. `.gitignore`) to ignore the local files and prevent them from being committed.

By default we assume you might have a local file called `local.config.json`. You can change this by passing in an array of names in the `localConfig` option. If you want to throw an error if any of the specified local config files are missing then set the `requireLocalConfig` option to true.

```javascript
// Default options for local config.
const config = require('config-ninja').init('my-config', {
  localConfig: ['local'],
  requireLocalConfig: false,
});
```

### Override the Config Directory
By default we assume the config files are located in `current working directory + '/config'`. You can change this by passing in an absolute or relative path as the second parameter:

```javascript
const config = require('config-ninja').init('my-config', '/path/to/cfg/dir/');
const config = require('config-ninja').init('my-config', {
  dir: '/path/to/cfg/dir/',
});
```

### Override the Environment
By default `production` and `development` environment strings are understood. If you have additional environments you can override the environment string by passing in a third parameter called `env`, which matches the name of your config file (e.g. `staging.config.json`):

```javascript
const config = require('config-ninja').init('my-config', '/path/to/cfg/dir/', 'staging');
const config = require('config-ninja').init('my-config', {
  dir: '/path/to/cfg/dir/',
  env: 'staging',
});
```

### Environment Variables
You can also load config from the environment variables, and optionally from a `.env` file (see config options below). You'll need to provide a mapping of environment variable names to paths in your config to use this feature. Environment variables overwrite values in your config files even if they are empty strings, but you can avoid this if don't set them at all in the environment.

**Note:** String representations of `true`, `null` `false`, integers and floats will be converted to their correct data types.

**Warning:** The `NODE_ENV` environment variable cannot be loaded from a `.env` file and will be ignored.

**Example .env file:**

```javascript
LOG_LEVEL=verbose
NINJA_AWESOMENESS="very awesome"
OFFSET=5
```

**Example mapping configuration:**

```javascript
{
  environmentVariables: {
    mapping: {
      LOG_LEVEL: `logLevel`,
      NINJA_AWESOMENESS: `how.awesome.are.ninjas`,
      OFFSET: `timezoneOffset`,
    }
  }
}
```

## API Overview

### .init(configId[, dir[, env[, options]]])
Sets up a new config object and returns it. Any of the following function signatures are acceptable:

* `.init(configId)`
* `.init(configId, dir)`
* `.init(configId, dir, env)`
* `.init(configId, dir, env, options)`
* `.init(configId, dir, options)`
* `.init(configId, options)`

You can specify the following options. You can either pass `dir` and `env` into the function as parameters, or add them as options, or rely on the default values.

| Option                            | Default     | Description |
|-----------------------------------|-------------|-------------|
| dir                               | `./config`  | Set the directory where your config is stored. Relative paths are relative to the current working directory of your process. |
| env                               | `process.env.NODE_ENV || 'development'` | Set the environment to a specific environment string (e.g. "production"), defaults to process.env.NODE_ENV or "development". |
| shortFilenames                    | false       | Set true if you want to your config filenames to be in the format of `development.json` instead of the default `development.config.json`. |
| environmentLevels                 | `{ production: 1, staging: 2, development: 3 }` | If the property `env` is not already specified in your config files this option will set `env.id` to the environment string (e.g. "production"), and will set `env.level` to the corresponding integer specified in this option. Pass in a falsy value to disable this feature. |
| localConfig[]                     | `['local']` | Specify a list of other filenames to merge into your config, if the files don't exist they will just be ignored by default. Properties in local files will overwrite properties with the same name in your config. |
| requireLocalConfig                | false       | By default we don't throw an error if a local config file is missing. Set true to throw an error instead. |
| environmentVariables.enableDotenv | false       | Set `true` to load in files from a `.env` file. |
| environmentVariables.dotenvPath   | false       | Optionally provide a custom absolute path to the `.env` file. |
| environmentVariables.mapping      |             | Provide a mapping of environment variables to paths in your config file (see the Environment Variables section above). |
| single                            |             | Set to a string e.g. "my-settings" if you only want to load a single config file e.g. "my-settings.config.json". |
| immutable                         | false       | Set true to force the config objects to always be immutable. |
| plain                             | false       | Set true to always construct the config without any of the utility functions attached. |

### .use(configId[, immutable[, plain]])
Return an existing config object that has been initialised with `.init()`.

You can pass true as the second parameter to return a copy of the config, which prevents accidental changes to the config from propagating through to other modules. This has no affect if the `immutable` option was passed to `.init()` as true.

You can also pass true as the third parameter if you wish to return a plain copy of the config without the utility functions attached. This has no affect if the `plain` option was passed to `.init()`.

### .wipe(configId)
This will remove the config from memory, allowing you to re-use an existing config id. This will NOT prevent other parts of your application from continuing to use the config if they have already got a reference to it from `.use()`.

## Config Overview
Once you have a config object you can use these utility functions:

### config.\_\_inspect()
Returns information about the config object, including some meta data and the options used to initialise the config in `.init()`.

### config.\_\_reload()
Reloads the config files from disk, using the original options passed to `.init()`. Returns the reloaded config, and if the `immutable` option is false it will also mutate the config object itself.

**Warning:** This operation is synchronous and blocking.

### config.\_\_switch(env)
Reloads the config files from disk and switches to the new environment specified, using the original options passed to `.init()`. Returns the new config, and if the `immutable` option is false it will also mutate the config object itself.

**Warning:** This operation is synchronous and blocking.

### config.\_\_addLocal(localConfig)
Reloads the config using the original options passed to `.init()`, but adds in the extra local config files you specify. Returns the reloaded config, and if the `immutable` option is false it will also mutate the config object itself.

**Warning:** This operation is synchronous and blocking.

### config.\_\_get(env)
Loads and prepares the config for the specified environment as if we had initialised under than environment, without actually modifying the existing config.

**Warning:** This operation is synchronous and blocking.

### config.\_\_raw(env)
Returns the raw JSON from the config file for the specified environment (from memory). Does not do any merging and does not mutate the existing config.

### config.\_\_plain()
Returns a copy of the config without any of the utility functions attached, just the plain properties from your config files.

### config.\_\_trace()
Returns a stack trace for when the config was first initialised (or reloaded/switched/etc) as an array of strings. Can be used for debugging to see which module and function instantiated the config object.

## FAQ

#### How can I tell which environment string my config was initialised with?
By default, the `env.id` property will be set inside your config. If you have manually specified a property called `env` in your config or the feature has been disabled (by setting the `localConfig` option) you can use the `config.__inspect()` method instead. This returns the options that were used to instantiate the config:

```javascript
const inspection = config.__inspect();
console.log(inspection.options.env);
```

#### How can I reload my config?
Simply call `config.__reload()`. This will reload config files from disk and variables from the environment. See the Config Overview above.

#### How can I change the environment of my config after initialisation?
Call `config.__switch(env)`. This will reload the config with the new environment set. See the Config Overview above.

#### How can I load in additional config files from disk after initialisation?
Call `config.__addLocal(localConfig)` and pass in an array of local config files to load. This will reload the config with the extra config files merged in. See the Config Overview section above.

#### How can I create a code branch that executes on multiple environments?
See the `localConfig` initilisation option. If your config files do not include a property called `env` then Config-Ninja will add in a property with this shape by default:
```javascript
// THIS
{
  id: "production",
  level: 1,
}

// OR THIS
{
  id: "staging",
  level: 2,
}

// OR THIS
{
  id: "development",
  level: 3,
}
```
You can use this to create code branches that only execute if the environment is above a certain "level". For example, the following branch will execute if the environment level is higher than 1. By default this will be either the "staging" or "development" environments.

 ```javascript
 if (config.env.level > 1) { ... }
 ```

#### Can I load config files asynchronously?
No. That's beyond the scope of this module. Config should be loaded when your application first boots, and then only sparingly. This will prevent expensive IO from getting in the way of your application's execution.

#### Can I load config from a database?
No. That's beyond the scope of this module.
