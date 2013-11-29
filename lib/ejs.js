
/*!
 * EJS
 * Copyright(c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('./utils')
  , Channel = require('./Channel')
  , path = require('path')
  , dirname = path.dirname
  , extname = path.extname
  , join = path.join
  , fs = require('fs')
  , read = fs.readFileSync;

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
    var parts = filter.split(':')
      , name = parts.shift()
      , args = parts.join(':') || '';
    if (args) args = ', ' + args;
    return 'filters.' + name + '(' + js + args + ')';
  });
};

/**
 * Re-throw the given `err` in context to the
 * `str` of ejs, `filename`, and `lineno`.
 *
 * @param {Error} err
 * @param {String} str
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

function rethrow(err, str, filename, lineno){
  var lines = str.split('\n')
    , start = Math.max(lineno - 3, 0)
    , end = Math.min(lines.length, lineno + 3);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? ' >> ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'ejs') + ':'
    + lineno + '\n'
    + context + '\n\n'
    + err.message;
  
  throw err;
}

/**
 * Channel identifiers
 */
const MAIN = 0
  , DEFAULT = 1;

/**
 * Parse the given `str` of ejs, returning the function body.
 *
 * @param {String} str
 * @return {String}
 * @api public
 */

var parse = exports.parse = function(str, options){
  var options = options || {}
    , open = options.open || exports.open || '<%'
    , close = options.close || exports.close || '%>'
    , filename = options.filename
    , compileDebug = options.compileDebug !== false
    , channels = []
    , buf = channels[MAIN] = new Channel();

  buf.push('var buf = [];');
  if (false !== options._with) buf.push('\nwith (locals || {}) { (function(){ ');
  buf.push('\n buf.push(\'');

  var lineno = 1;

  var consumeEOL = false;

  var extendPath = null
    , blockName = null;

  for (var i = 0, len = str.length; i < len; ++i) {
    var stri = str[i];
    if (str.slice(i, open.length + i) == open) {
      i += open.length
  
      var prefix, postfix, line = (compileDebug ? '__stack.lineno=' : '') + lineno;
      switch (str[i]) {
        case '=':
          prefix = "', escape((" + line + ', ';
          postfix = ")), '";
          ++i;
          break;
        case '-':
          prefix = "', (" + line + ', ';
          postfix = "), '";
          ++i;
          break;
        default:
          prefix = "');" + line + ';';
          postfix = "; buf.push('";
      }

      var end = str.indexOf(close, i)
        , js = str.substring(i, end)
        , start = i
        , n = 0;

      if ('-' == js[js.length-1]){
        js = js.substring(0, js.length - 2);
        consumeEOL = true;
      }

      if (0 == js.trim().indexOf('extend')) {
        var name = js.trim().slice(7).trim();
        if (!filename) throw new Error('filename option is required for extensions');
        extendPath = resolveFile(name, filename);
        buf.push(extend({ _blocks: options._blocks !== false }));
        buf = channels[DEFAULT] = new Channel();
        js = '';
      }
      if (true == /^block\s/.test(js.trim())) {
        if (blockName) throw new Error('expecting endblock, block found');
        blockName = js.trim().slice(5).trim();
        buf = channels[MAIN];
        buf.push(block(blockName));
        js = '';
      }
      if (0 == js.trim().indexOf('endblock')) {
        blockName = null;
        buf.push(endblock());
        buf = channels[DEFAULT];
        js = '';
      }
      if (0 == js.trim().indexOf('include')) {
        var name = js.trim().slice(7).trim();
        if (!filename) throw new Error('filename option is required for includes');
        var path = resolveFile(name, filename);
        buf.push(include(path, { filename: path, _with: false, open: open, close: close, compileDebug: compileDebug }));
        js = '';
      }

      while (~(n = js.indexOf("\n", n))) n++, lineno++;
      if (js.substr(0, 1) == ':') js = filtered(js);
      if (js) {
        if (js.lastIndexOf('//') > js.lastIndexOf('\n')) js += '\n';
        buf.push(prefix);
        buf.push(js);
        buf.push(postfix);
      }
      i += end - start + close.length - 1;

    } else if (stri == "\\") {
      buf.push("\\\\");
    } else if (stri == "'") {
      buf.push("\\'");
    } else if (stri == "\r") {
      // ignore
    } else if (stri == "\n") {
      if (consumeEOL) {
        consumeEOL = false;
      } else {
        buf.push("\\n");
        lineno++;
      }
    } else {
      buf.push(stri);
    }
  }

  if (extendPath) {
    if (blockName) throw new Error('expecting endblock, eof found');
    buf = channels[MAIN];
    buf.push(block('default'));
    buf.push(channels[DEFAULT].toString());
    buf.push(endblock());
    buf.push(endextend(extendPath, { filename: extendPath, _with: false, open: open, close: close, compileDebug: compileDebug, _blocks: false }));
  }
  if (false !== options._with) buf.push("'); })();\n} \nreturn buf.join('');");
  else buf.push("');\nreturn buf.join('');");
  return buf.toString();
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
  options = options || {};
  var escape = options.escape || utils.escape;
  
  var input = JSON.stringify(str)
    , compileDebug = options.compileDebug !== false
    , client = options.client
    , filename = options.filename
        ? JSON.stringify(options.filename)
        : 'undefined';
  
  if (compileDebug) {
    // Adds the fancy stack trace meta info
    str = [
      'var __stack = { lineno: 1, input: ' + input + ', filename: ' + filename + ' };',
      rethrow.toString(),
      'try {',
      exports.parse(str, options),
      '} catch (err) {',
      '  rethrow(err, __stack.input, __stack.filename, __stack.lineno);',
      '}'
    ].join("\n");
  } else {
    str = exports.parse(str, options);
  }
  
  if (options.debug) console.log(str);
  if (client) str = 'escape = escape || ' + escape.toString() + ';\n' + str;

  try {
    var fn = new Function('locals, filters, escape, rethrow', str);
  } catch (err) {
    if ('SyntaxError' == err.name) {
      err.message += options.filename
        ? ' in ' + filename
        : ' while compiling ejs';
    }
    throw err;
  }

  if (client) return fn;

  return function(locals){
    return fn.call(this, locals, filters, escape, rethrow);
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
  var fn
    , options = options || {};

  if (options.cache) {
    if (options.filename) {
      fn = cache[options.filename] || (cache[options.filename] = compile(str, options));
    } else {
      throw new Error('"cache" option requires "filename".');
    }
  } else {
    fn = compile(str, options);
  }

  options.__proto__ = options.locals;
  return fn.call(options.scope, options);
};

/**
 * Render an EJS file at the given `path` and callback `fn(err, str)`.
 *
 * @param {String} path
 * @param {Object|Function} options or callback
 * @param {Function} fn
 * @api public
 */

exports.renderFile = function(path, options, fn){
  var key = path + ':string';

  if ('function' == typeof options) {
    fn = options, options = {};
  }

  options.filename = path;

  var str;
  try {
    str = options.cache
      ? cache[key] || (cache[key] = read(path, 'utf8'))
      : read(path, 'utf8');
  } catch (err) {
    fn(err);
    return;
  }
  fn(null, exports.render(str, options));
};

/**
 * Mark template to use extend and blocks
 *
 * @return {String}
 * @api private
 */
function extend(options) {
  var options = options || {}
    , buf = "";

  buf += "');";
  if (false !== options._blocks) {
    buf += "\n var blocks = {};";
  }

  return buf;
}

/**
 * Render an EJS layout file at given `path`
 *
 * @param {String} path
 * @param {Object} options
 * @return {String}
 * @api private
 */
function endextend(path, options) {
  return "\n buf.push('" + include(path, options);
}

/**
 * Render a block with the given `name`
 *
 * @param {String} name
 * @return {String}
 * @api private
 */
function block(name) {
  var buf = "";
  buf += "\n if (!blocks['" + name + "']) blocks['" + name + "'] = (function() {";
  buf += "\n  var buf=[];\n  buf.push('";
  return buf;
}

/**
 * Close block rendering
 *
 * @return {String}
 * @api private
 */
function endblock() {
  return "');\n  return buf.join('');\n })();";
}

/**
 * Include an EJS file at given `path`
 *
 * @param {String} path
 * @param {Object} options
 * @return {String}
 * @api private
 */
function include(path, options) {
  var include = read(path, 'utf8');
  include = exports.parse(include, options);
  return "' + (function(){" + include + "})() + '";
}

/**
 * Resolve file `name` relative to `filename`.
 *
 * @param {String} name
 * @param {String} filename
 * @return {String}
 * @api private
 */

function resolveFile(name, filename) {
  var path = join(dirname(filename), name);
  var ext = extname(name);
  if (!ext) path += '.ejs';
  return path;
}

// express support

exports.__express = exports.renderFile;

/**
 * Expose to require().
 */

if (require.extensions) {
  require.extensions['.ejs'] = function (module, filename) {
    filename = filename || module.filename;
    var options = { filename: filename, client: true }
      , template = fs.readFileSync(filename).toString()
      , fn = compile(template, options);
    module._compile('module.exports = ' + fn.toString() + ';', filename);
  };
} else if (require.registerExtension) {
  require.registerExtension('.ejs', function(src) {
    return compile(src, {});
  });
}
