'use strict';

module.exports = appRequirePath;

var fs = require('fs'),
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
            } else if (modulePath[0] === '.') {
                modulePath = path.join((dirname || process.cwd()), modulePath);
            }
            modulePath = resolveEnvVars(modulePath);
            return modulePath;
        },

        /**
         * requires a file relative to the applicaiton rootPath
         *
         * @param modulePath String path to the module
         **/
        require: function requireModule(modulePath) {
            return require(iface.resolve(modulePath));
        },

        // TODO: add the good parts from [requireFrom](https://github.com/dskrepps/requireFrom)
        // add in createLinks method to add symlinks to node_modules for defined paths

        /**
         * returns the rootPath of the application/module
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
    var resolved = path.resolve(dirname),
        rootPath = null,
        parts = resolved.split(path.sep),
        i = parts.length,
        filename;

    // Attempt to locate root path based on the existence of `package.json`
    while (rootPath === null && i > 0) {
        try {
            filename = path.join(parts.slice(0, i).join(path.sep), 'package.json');
            i--;
            if (fs.statSync(filename).isFile()) {
                rootPath = path.dirname(filename);
            }
        } catch(err) {
            // the ENOENT error just indicates we need to look up the path
            continue;
        }
    }

    // If the above didn't work, or this module is loaded globally, then
    // resort to require.main.filename (See http://nodejs.org/api/modules.html)
    if (null === rootPath) {
        console.log('using alternate method');
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
