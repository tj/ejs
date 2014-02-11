ejs = (function(){

// CommonJS require()

function require(p){
    if ('fs' == p) return {};
    if ('path' == p) return {};
    var path = require.resolve(p)
      , mod = require.modules[path];
    if (!mod) throw new Error('failed to require "' + p + '"');
    if (!mod.exports) {
      mod.exports = {};
      mod.call(mod.exports, mod, mod.exports, require.relative(path));
    }
    return mod.exports;
  }

require.modules = {};

require.resolve = function (path){
    var orig = path
      , reg = path + '.js'
      , index = path + '/index.js';
    return require.modules[reg] && reg
      || require.modules[index] && index
      || orig;
  };

require.register = function (path, fn){
    require.modules[path] = fn;
  };

require.relative = function (parent) {
    return function(p){
      if ('.' != p.substr(0, 1)) return require(p);
      
      var path = parent.split('/')
        , segs = p.split('/');
      path.pop();
      
      for (var i = 0; i < segs.length; i++) {
        var seg = segs[i];
        if ('..' == seg) path.pop();
        else if ('.' != seg) path.push(seg);
      }

      return require(path.join('/'));
    };
  };


require.register("Channel.js", function(module, exports, require){
/*!
 * EJS - Filters
 * Copyright(c) 2013 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

module.exports = exports = Channel;

/**
 * Represents a channel to buffer a template in
 *
 * @constructor
 */

function Channel() {
	this.buf = '';
};

/**
 * Push `str` into buffer
 *
 * @param {String} str
 * @api public
 */

Channel.prototype.push = function(str) {
	this.buf += str;
}

/**
 * Return the string contents of the buffer
 * 
 * @return {String}
 * @api public
 */

Channel.prototype.toString = function() {
	return this.buf;
}

}); // module: Channel.js

require.register("utils.js", function(module, exports, require){

/*!
 * EJS
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function(html){
  return String(html)
    .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;');
};
 

}); // module: utils.js

require.register("ejs.js", function(module, exports, require){

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
  , Stack = require('./Stack')
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
 * Identifiers
 *
 * @type {number}
 */
const MAIN = 0
  , EXTEND = 1
  , BLOCK = 2
  , HIDDEN = 99;

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
    , stack = new Stack()
    , channels = [];

  channels[MAIN] = new Channel();
  channels[HIDDEN] = new Channel();

  var scope = stack.push({
    type: MAIN,
    buf: channels[MAIN]
  });

  scope.buf.push('var buf = [];');
  if (false !== options._blocks) scope.buf.push('\nvar blocks = {};');
  if (false !== options._with) scope.buf.push('\nwith (locals || {}) { (function(){ ');
  scope.buf.push('\n buf.push(\'');

  var lineno = 1;

  var consumeEOL = false;

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

      js = commands(js, stack, channels, {
        filename: filename,
        open: open,
        close: close,
        compileDebug: compileDebug
      });
      scope = stack.scope();

      while (~(n = js.indexOf("\n", n))) n++, lineno++;
      if (js.substr(0, 1) == ':') js = filtered(js);
      if (js) {
        if (js.lastIndexOf('//') > js.lastIndexOf('\n')) js += '\n';
        scope.buf.push(prefix);
        scope.buf.push(js);
        scope.buf.push(postfix);
      }
      i += end - start + close.length - 1;

    } else if (stri == "\\") {
      scope.buf.push("\\\\");
    } else if (stri == "'") {
      scope.buf.push("\\'");
    } else if (stri == "\r") {
      // ignore
    } else if (stri == "\n") {
      if (consumeEOL) {
        consumeEOL = false;
      } else {
        scope.buf.push("\\n");
        lineno++;
      }
    } else {
      scope.buf.push(stri);
    }
  }

  if (scope.type === BLOCK) throw new Error('expecting endblock, eof found');
  if (scope.type === EXTEND) {
    var path = scope.path;
    scope = stack.pop();
    scope.buf.push(endextend(path, { filename: path, _with: false, _blocks: false, open: open, close: close, compileDebug: compileDebug }));
  }
  if (false !== options._with) scope.buf.push("'); })();\n} \nreturn buf.join('');");
  else scope.buf.push("');\nreturn buf.join('');");
  return scope.buf.toString();
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
 * Handle template commands.
 *
 * @param {String} js
 * @param {Object} scope
 * @param {Array} stack
 * @param {Array} channels
 * @param {Object} options
 * @return {String}
 * @api private
 */
function commands(js, stack, channels, options) {
  var command = js.trim()
    , scope = stack.scope();

  switch(true) {
    case /^extend\s/.test(command):
      var name = js.trim().slice(7).trim();
      if (!options.filename) throw new Error('filename option is required for extensions');
      var path = resolveFile(name, options.filename);
      scope.buf.push(extend());
      scope = stack.push({ type: EXTEND, path: path, buf: channels[HIDDEN] });
      return '';
    case /^block\s/.test(command):
      var name = js.trim().slice(6).trim()
        , isExtend = scope.type === EXTEND;
      scope = stack.push({ type: BLOCK, name: name, buf: channels[MAIN] });
      scope.buf.push(block(name, !isExtend));
      return '';
    case /^endblock$/.test(command):
      if (scope.type !== BLOCK) throw new Error('endblock found with no matching block');
      var buf = scope.buf;
      scope = stack.pop();
      buf.push(endblock(scope.type !== EXTEND));
      return '';
    case /^sblock\s/.test(command):
      var name = js.trim().slice(7).trim();
      if (scope.type === EXTEND) throw new Error('sblock cannot be used to declare a block');
      scope.buf.push(sblock(name));
      return '';
    case /^include\s/.test(command):
      var name = js.trim().slice(7).trim();
      if (!options.filename) throw new Error('filename option is required for includes');
      var path = resolveFile(name, options.filename);
      scope.buf.push(include(path, { filename: path, open: options.open, close: options.close, compileDebug: options.compileDebug }));
      return '';
  }
  return js;
}

/**
 * Mark template to use extend and blocks
 *
 * @return {String}
 * @api private
 */
function extend(options) {
  var buf = "";
  buf += "');";
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
function block(name, embed) {
  var buf = "";
  if (embed) buf += "', blocks['" + name + "'] || (function() {";
  else buf += "\n if (!blocks['" + name + "']) blocks['" + name + "'] = (function() {";
  buf += "\n  var buf=[];\n  buf.push('";
  return buf;
}

/**
 * Close block rendering
 *
 * @return {String}
 * @api private
 */
function endblock(embed) {
  var buf = "";
  buf += "');\n  return buf.join('');\n })()";
  if (embed) buf += ", '";
  else buf += ";";
  return buf;
}

/**
 * Embed a block with the given `name`
 *
 * @param {String} name
 * @return {String}
 * @api private
 */
function sblock(name) {
  return "', blocks['" + name + "'] || '', '";
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

}); // module: ejs.js

require.register("filters.js", function(module, exports, require){
/*!
 * EJS - Filters
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * First element of the target `obj`.
 */

exports.first = function(obj) {
  return obj[0];
};

/**
 * Last element of the target `obj`.
 */

exports.last = function(obj) {
  return obj[obj.length - 1];
};

/**
 * Capitalize the first letter of the target `str`.
 */

exports.capitalize = function(str){
  str = String(str);
  return str[0].toUpperCase() + str.substr(1, str.length);
};

/**
 * Downcase the target `str`.
 */

exports.downcase = function(str){
  return String(str).toLowerCase();
};

/**
 * Uppercase the target `str`.
 */

exports.upcase = function(str){
  return String(str).toUpperCase();
};

/**
 * Sort the target `obj`.
 */

exports.sort = function(obj){
  return Object.create(obj).sort();
};

/**
 * Sort the target `obj` by the given `prop` ascending.
 */

exports.sort_by = function(obj, prop){
  return Object.create(obj).sort(function(a, b){
    a = a[prop], b = b[prop];
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
  });
};

/**
 * Size or length of the target `obj`.
 */

exports.size = exports.length = function(obj) {
  return obj.length;
};

/**
 * Add `a` and `b`.
 */

exports.plus = function(a, b){
  return Number(a) + Number(b);
};

/**
 * Subtract `b` from `a`.
 */

exports.minus = function(a, b){
  return Number(a) - Number(b);
};

/**
 * Multiply `a` by `b`.
 */

exports.times = function(a, b){
  return Number(a) * Number(b);
};

/**
 * Divide `a` by `b`.
 */

exports.divided_by = function(a, b){
  return Number(a) / Number(b);
};

/**
 * Join `obj` with the given `str`.
 */

exports.join = function(obj, str){
  return obj.join(str || ', ');
};

/**
 * Truncate `str` to `len`.
 */

exports.truncate = function(str, len, append){
  str = String(str);
  if (str.length > len) {
    str = str.slice(0, len);
    if (append) str += append;
  }
  return str;
};

/**
 * Truncate `str` to `n` words.
 */

exports.truncate_words = function(str, n){
  var str = String(str)
    , words = str.split(/ +/);
  return words.slice(0, n).join(' ');
};

/**
 * Replace `pattern` with `substitution` in `str`.
 */

exports.replace = function(str, pattern, substitution){
  return String(str).replace(pattern, substitution || '');
};

/**
 * Prepend `val` to `obj`.
 */

exports.prepend = function(obj, val){
  return Array.isArray(obj)
    ? [val].concat(obj)
    : val + obj;
};

/**
 * Append `val` to `obj`.
 */

exports.append = function(obj, val){
  return Array.isArray(obj)
    ? obj.concat(val)
    : obj + val;
};

/**
 * Map the given `prop`.
 */

exports.map = function(arr, prop){
  return arr.map(function(obj){
    return obj[prop];
  });
};

/**
 * Reverse the given `obj`.
 */

exports.reverse = function(obj){
  return Array.isArray(obj)
    ? obj.reverse()
    : String(obj).split('').reverse().join('');
};

/**
 * Get `prop` of the given `obj`.
 */

exports.get = function(obj, prop){
  return obj[prop];
};

/**
 * Packs the given `obj` into json string
 */
exports.json = function(obj){
  return JSON.stringify(obj);
};

}); // module: filters.js

require.register("Stack.js", function(module, exports, require){
/*!
 * EJS - Filters
 * Copyright(c) 2013 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

module.exports = exports = Stack;

/**
 * Represents a stack of template scopes
 *
 * @constructor
 */

function Stack() {
	this.stack = [];
};

/**
 * Get the top-most scope
 *
 * @param {String} str
 * @api public
 */

Stack.prototype.scope = function() {
	return this.stack[this.stack.length-1];
};

/**
 * Push `scope` into stack
 *
 * @param {object} scope
 * @return {object}
 * @api public
 */

Stack.prototype.push = function(scope) {
	this.stack.push(scope);
	return this.scope();
};

/**
 * Pop `scope` from stack
 *
 * @param {object} scope
 * @return {object}
 * @api public
 */

Stack.prototype.pop = function() {
	this.stack.pop();
	return this.scope();
};

}); // module: Stack.js

 return require("ejs");
})();