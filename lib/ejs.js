
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

exports.version = '0.0.4';

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
  /* The parsing strategy is to do a single pass through the ejs string looking
   * for 2 things, ejs tags (<%* %>) and single quotes outside of the ejs tags.
   * The single quotes need to be escaped, and the ejs tags dealt with also.
   *
   * We will build a second string (newStr) which will be an array of string
   * fragemnts that will be joined together and returned.
   *
   * This new string will be javascript code that will be evaled into a function
   * which will create the final output.
   */

  var newStr =
    [ "var buf = []"
    , "\nwith (locals) {"
    , "\n  buf.push('"
    ]

  var ejsLen = str.length
  for (var curIndex = 0; curIndex < ejsLen; curIndex++)
  {

    if (str[curIndex] == '<' && str[curIndex+1] == '%' ) { // ejs tag
      curIndex += 2

      var jsPrefix, jsPostfix

      if (str[curIndex] == '=') {
        jsPrefix = "', escape("
        jsPostfix = "), '"
        curIndex++
      } else if (str[curIndex] == '-') {
        jsPrefix = "', "
        jsPostfix = ", '"
        curIndex++
      } else {
        jsPrefix = "'); "
        jsPostfix = "; buf.push('"
      }

      var startOfJs = curIndex
      var endOfJs = str.indexOf("%>", curIndex) - 1

      newStr.push(jsPrefix, str.slice(startOfJs, endOfJs), jsPostfix)

      curIndex += endOfJs - startOfJs + 2

    } else if (str[curIndex] == "\\") {
        newStr.push("\\\\")
    } else if (str[curIndex] == "'") {
        newStr.push("\\'")
    } else if (str[curIndex] == "\r") {
      newStr.push(" ")
    } else if (str[curIndex] == "\n") {
      newStr.push("\\n")
    } else {
      newStr.push(str[curIndex])
    }
  }
  newStr.push("');\n}\nreturn buf.join('');")
  return newStr.join('')
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
