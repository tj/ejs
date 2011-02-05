
/*!
 * EJS
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var sys = require('sys'),
    utils = require('./utils');

/**
 * Library version.
 */

exports.version = '0.2.1';

/**
 * Filters.
 * 
 * @type Object
 */

var filters = exports.filters = require('./filters');

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
 * Translate filtered code into function calls.
 *
 * @param {String} js
 * @return {String}
 * @api private
 */

function filtered(js) {
    return js.substr(1).split('|').reduce(function(js, filter){
        var parts = filter.split(':'),
            name = parts.shift(),
            args = parts.shift() || '';
        if (args) args = ', ' + args;
        return 'filters.' + name + '(' + js + args + ')';
    });
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

    var closeHeap = []; // to be used by prepareJsCode().

    var buf = [
        "var buf = [];",
        "\nwith (locals) {",
        "\n  buf.push('"
    ];

    for (var i = 0, len = str.length; i < len; ++i) {
        if (str.slice(i, open.length + i) == open) {
            // got a javascript or filter block
            i += open.length

            var start = i;
            var end = str.indexOf(close, start);
            var rawCode = str.substring(start, end);
            buf.push( prepareJsCode(rawCode, closeHeap) );
            i = end + close.length - 1;

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
 * - Recognize the input mode (`=` expression escaped print, `-` expression raw
 *   print, `:` expression filtered print, or free and non printed js code)
 * - Replace some words inside javascript code to extend the interaction between
 *   the js and ejs. Currently the words are `%RENDER`, `%COMPILE(...)`, both at
 *   the end of code block (`<% ... %>`), and `END` at the start of the block.
 *   That also prefix/postfix the code this the template needed snippet.
 *
 * @param {String} rawCode
 * @param {array} closeHeap
 * @return {String}
 * @api reserved
 */

function prepareJsCode(rawCode, closeHeap) {
    var jsInputMode = rawCode[0];
    if( jsInputMode == '=' || jsInputMode == '-' )
      rawCode = rawCode.substr(1);

    var isFilter = rawCode[0] == ':';

    var prefix, postfix;
    switch (jsInputMode) {
        case '=':
            prefix  = "', escape(";
            postfix = "), '";
            break;
        case '-':
            prefix  = "', ";
            postfix = ", '";
            break;
        default:
            prefix  = "'); ";
            postfix = "; buf.push('";
    }

    var er, jsCode = rawCode,
        funcIni = "{ var buf = []; buf.push('",
        funcEnd = "'); return buf.join('');}";
    if( (er=/%RENDER$/).test(rawCode) ) {
        jsCode = rawCode.replace(er, '(function()'+funcIni);
        closeHeap.push([funcEnd+')()', postfix]);
        postfix = '';
    }
    if( (er=/%COMPILE\(([^)]*)\)$/).test(rawCode) ) {
        jsCode = rawCode.replace(er, 'function($1)'+funcIni);
        closeHeap.push([funcEnd, postfix]);
        postfix = '';
    }
    if( (er=/^END(.*)$/).test(rawCode) ) {
        var close = closeHeap.pop();
        jsCode = close[0] + rawCode.replace(er, '$1')
               + close[1] + "'); buf.push('";
        prefix = '';
        postfix = '';
    }

    return prefix + ( isFilter ? filtered(jsCode) : jsCode ) + postfix;
}

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
    var fn = new Function('locals, filters, escape', parse(str, options));
    return function(locals){
        return fn.call(this, locals, filters, utils.escape);
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
 *   - `scope`           Function execution context
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
            fn = cache[options.filename] || (cache[options.filename] = compile(str, options));
        } else {
            throw new Error('"cache" option requires "filename".');
        }
    } else {
        fn = compile(str, options);
    }
    return fn.call(options.scope, options.locals || {});
};

/**
 * Expose to require().
 */

if (require.extensions) {
    require.extensions['.ejs'] = function(module, filename) {
        source = require('fs').readFileSync(filename, 'utf-8');
        module._compile(compile(source, {}), filename);
     };
} else if (require.registerExtension) {
    require.registerExtension('.ejs', function(src) {
        return compile(src, {});
    });
}
