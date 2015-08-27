# app-require-path

A module to ease the burden of requiring files from within a project. Unlike some similar
modules this module functions correctly whether in a final project or a module used by
other projects.

## Usage

```javascript
// Override `require`, this is completely optional.
var require = require(‘app-require-path’)().require;

// Require `lib/errors` from the base of your project
var errors = require(‘~/lib/errors);

// require a project module using the value of an environment variable as
// part of the filename. If the environment variable isn’t set use ‘default’.
var envConfig = require(‘~/{% NODE_ENV|default %}-config’);

// require a module using the default module search paths
var other = require(‘other’);
```

## Methodology

Much of the code is identical to that of [app-root-path](https://github.com/inxilpro/node-app-root-path)
though this module does not base the project root detection on the presence of `node_modules` folder.
Instead attempts to locate a `package.json` file are used as all node modules/projects should have such
a file even if they have no external dependencies.

Additionally this module is safe to use within a module which is developed and intended for others to
include within their projects. To ensure safe usage within such a module you should supply
`__dirname` when you require this module.


```javascript
var require = require(‘app-require-path)(__dirname).require;
```

### Inspired by:

* [app-root-path](https://github.com/inxilpro/node-app-root-path)
* [requiro](https://github.com/unlight/requiro)
