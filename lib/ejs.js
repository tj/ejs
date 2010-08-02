
/*!
 * EJS
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var sys = require('sys');

/**
 * Library version.
 */

exports.version = '0.0.3';

/**
 * Intermediate js cache.
 * 
 * @type Object
 */

var cache = {};

/**
 * Clear intermediate js cache.
 *
 * @api public
 */

exports.clearCache = function(){
    cache = {};
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

function escape(html){
    return String(html)
        .replace(/&(?!\w+;)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Parse the given `str` of ejs, returning the function body.
 *
 * @param {String} str
 * @return {String}
 * @api public
 */

var parse = exports.parse = function(str){
    str = String(str)
        .replace(/\r/g, " ")    // no carriage returns, used later
        .replace(/\n/g, "\\n"); // escaped newlines

    var output = '';

    while(str) {
        // split() with a limit doesn't return the remainder, do it another way
        var parts = str.replace('<%', '\r').split('\r');
        var content = parts.shift(), remainder = parts.shift();

        if(content) {
          // escape single quotes
          content = content.replace(/'/g, '\\\'');
          output += '\'' + content + '\', ';
        }

        if(remainder) {
          var code_parts = remainder.replace('%>', '\r').split('\r');
          var code = code_parts.shift();
          // escaped output
          if(code.match(/^=/)) {
            output += code.replace(/^=(.*)/, "escape($1), ");
          }
          // raw output
          else if(code.match(/^-/)) {
            output +=  code.replace(/^-(.*)/, "$1, ");
          }
          // unbuffered output
          else {
            output += "''); " + code + 'buf.push(';
          }
          str = code_parts.shift();
        }
        else {
          str = remainder;
        }
    }

    return 'var buf = [];\n'
        + "with (locals) {\nbuf.push("
        + output
        + "'');\n}\nreturn buf.join('');";
};

/**
 * Compile the given `str` of ejs into a `Function`.
 *
 * @param {String} str
 * @param {Object} options
 * @return {Function}
 * @api public
 */

var compile = exports.compile = function(str, options){
    if (options.debug) sys.puts(parse(str));
    return function(locals){
        var fn = new Function('locals, escape', parse(str));
        return fn.call(this, locals, escape);
    }
};

/**
 * Render the given `str` of ejs.
 *
 * Options:
 *
 *   - `locals`          Local variables object
 *   - `cache`           Compiled functions are cached, requires `filename`
 *   - `filename`        Used by `cache` to key caches
 *   - `context|scope`   Function execution context
 *   - `debug`           Output generated function body
 *
 * @param {String} str
 * @param {Object} options
 * @return {String}
 * @api public
 */

exports.render = function(str, options){
    var fn,
        options = options || {};
    if (options.cache) {
        if (options.filename) {
            fn = cache[options.filename] = compile(str, options);
        } else {
            throw new Error('"cache" option requires "filename".');
        }
    } else {
        fn = compile(str, options);
    }
    return fn.call(options.context || options.scope, options.locals || {});
};
