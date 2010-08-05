
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

exports.version = '0.2.0';

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

var parse = exports.parse = function(str, options){
    var options = options || {},
        open = options.open || exports.open || '<%',
        close = options.close || exports.close || '%>';

    var buf = [
        "var buf = []",
        "\nwith (locals) {",
        "\n  buf.push('"
    ];

    for (var i = 0, len = str.length; i < len; ++i) {
        if (str[i] == open[0] && str[i+1] == open[1] ) {
            i += 2
        
            var prefix, postfix;
            if (str[i] == '=') {
                prefix = "', escape(";
                postfix = "), '";
                ++i;
            } else if (str[i] == '-') {
                prefix = "', ";
                postfix = ", '";
                ++i;
            } else {
                prefix = "'); ";
                postfix = "; buf.push('";
            }
        
            var start = i;
            var end = str.indexOf(close, i);
            buf.push(prefix, str.slice(i, end), postfix);
            i += end - start + 1;
        
        } else if (str[i] == "\\") {
            buf.push("\\\\");
        } else if (str[i] == "'") {
            buf.push("\\'");
        } else if (str[i] == "\r") {
            buf.push(" ");
        } else if (str[i] == "\n") {
            buf.push("\\n");
        } else {
            buf.push(str[i]);
        }
    }
    buf.push("');\n}\nreturn buf.join('');")
    return buf.join('')
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
        var fn = new Function('locals, escape', parse(str, options));
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
 *   - `open`            Open tag, defaulting to "<%"
 *   - `close`           Closing tag, defaulting to "%>"
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
