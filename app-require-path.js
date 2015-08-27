'use strict';

module.exports = appRequirePath;

var fs = require('fs'),
    globalPaths = require('module').globalPaths,
    path = require('path');

function appRequirePath(dirname) {
    var rootPath = detectRoot(dirname || path.dirname(__dirname));
    var iface = {
        /**
         * Resolves a path. Expands ~ to the project root, and {% ENV %} to the
         * value of the specified environment variable or the default value.
         *
         * @param modulePath String path to the module
         **/
        resolve: function resolve(modulePath) {
            if (modulePath[0] === '~') {
                modulePath = path.join(rootPath, modulePath.substr(1));
            }
            modulePath = resolveEnvVars(modulePath);
            return modulePath;
        },

        /**
         * requires a file relative to the applicaiton rootPath
         *
         * @param modulePath String path to the module
         **/
        require: function arpRequire(modulePath) {
            return require(iface.resolve(modulePath));
        },

        /**
         * returns the rootPath of the application
         **/
        toString: function toString() {
            return rootPath;
        },
    };
    /**
     * creates the `path` getter/setter which allows overriding of the auto detected path.
     **/
    Object.defineProperty(iface, 'path', {
        get: function() { return rootPath; },
        set: function(explicitPath) { rootPath = explicitPath; },
        enumerable: true,
    });

    return iface;
}

/**
 * Detects the root path of the application.
 *
 * @param dirname String a directory within the application
 **/
function detectRoot(dirname) {
    // check for environment variables
    if (process.env.NODE_PATH || process.env.APP_ROOT_PATH) {
        return path.resolve(process.env.NODE_PATH || process.env.APP_ROOT_PATH);
    }
    var alternateMethod = false,
        resolved = path.resolve(dirname),
        rootPath = null,
        parts = resolved.split(path.sep),
        filename;
    // Check to see if module was loaded from a global include path
    globalPaths.forEach(function(globalPath) {
        if (!alternateMethod && 0 === resolved.indexOf(globalPath)) {
            alternateMethod = true;
        }
    });

    // Attempt to locate root path based on the existence of `package.json`
    if (!alternateMethod) {
        for (var i=parts.length; i > 0; i--) {
            try {
                filename = path.join(parts.slice(0, i).join(path.sep), 'package.json');
                if (fs.statSync(filename).isFile()) {
                    rootPath = path.dirname(filename);
                    break;
                }
            } catch(err) {
                // the ENOENT error just indicates we need to look up the path
                continue;
            }
        }
    }

    // If the above didn't work, or this module is loaded globally, then
    // resort to require.main.filename (See http://nodejs.org/api/modules.html)
    if (alternateMethod || null === rootPath) {
        rootPath = path.dirname(require.main.filename);
    }

    return path.resolve(rootPath);
}

/**
 * resolve environment variables in `modulePath`. Valid syntax is {%VAR} or {%VAR%} with
 * an optional default value specified as {% VAR|default %}. If no default value is supplied
 * then an empty string will be used.
 *
 * @param modulePath String path to module
 **/
function resolveEnvVars(modulePath) {
    var nPos1 = modulePath.indexOf("{%"), nPos2, name, value, defaultVal, parts;
    while (nPos1 !== -1) {
        nPos2 = modulePath.indexOf("}", nPos1);
        name = modulePath.substring(nPos1 + 2, nPos2);
        if (name.slice(-1) === "%") {
            name = name.slice(0, -1);
        }
        parts = name.split('|');
        name = parts[0].trim();
        defaultVal = (parts[1] || '').trim();
        value = process.env[name] || defaultVal;
        modulePath = modulePath.slice(0, nPos1) + value + modulePath.slice(nPos2 + 1);
        nPos1 = modulePath.indexOf("{%");
    }
    return modulePath;
}
