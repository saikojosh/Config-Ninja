# Config-Ninja
A quick and easy way to read in config files from disk depending on the enviroment. By default Config Ninja uses the `NODE_ENV` environment variable to determin whether we are running in `production` mode, otherwise `development` mode is assumed.

**Important:** The `production` config is always the default config. If you specify another enviroment, Config Ninja will copy the properties from that environment into the production config, overwriting any values that already exist. Nested properties will be respected. No changes are saved to disk.

## Quick Start
```javascript
// On application load prepare the ninja.
var config = require('config-ninja').init('/path/to/cfg/dir/');

// In another module we need config again...
var config = require('config-ninja');

// Use our config.
console.dir(config);
console.log('Super:', config.nested.super);
```

## Override Environment
By default `production` and `development` environment strings are understood. If you have additional environments you can override the environment string by passing in a second parameter `env`:
```javascript
var config = require('config-ninja').init('/path/to/cfg/dir/', 'staging');
```
Where `env` is the name of your config file e.g. `staging.config.json`.

## Setup Config Files
Typically you will need 2 config files, one for `production` and one for `development`. You may also want config files for other enviroments such as `staging`.

```
/myConfig
  /production.config.json
  /staging.config.json
  /development.config.json
  /custom.config.json
```

## FAQ

#### How can I tell the enviroment my config was initialised with?
The enviroment string for a given config variable is stored under `config._env`. **Warning:** If any of your config files contain a property called `_env` this will overwrite `config._env`.

#### How can I reload my config?
Simply call `config.init()` again without any parameters. **Warning:** If any of your config files contain a property called `_cfgPath` this will break and you will need to specify the directory path again.

#### How can I change the enviroment of my config during runtime?
Call `config.init(null, 'new-environment-string');` This will reload the config with the new environment.
