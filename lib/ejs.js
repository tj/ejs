/*!
* EJS
* Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
* MIT Licensed
*/
(function(exports) {  
  /**
   * Module dependencies.
   */
  
  var sys = typeof require === "function" ? require('sys') : null;
  
  /**
   * Library version.
   */
  
  exports.version = '0.4.1';
  
  /**
   * Filters.
   * 
   * @type Object
   */

  var filters = exports.filters = {

    /**
     * First element of the target `obj`.
     */

    first : function(obj) {
      return obj[0];
    },

    /**
     * Last element of the target `obj`.
     */

    last : function(obj) {
      return obj[obj.length - 1];
    },

    /**
     * Capitalize the first letter of the target `str`.
     */

    capitalize : function(str){
      str = String(str);
      return str[0].toUpperCase() + str.substr(1, str.length);
    },

    /**
     * Downcase the target `str`.
     */

    downcase : function(str){
      return String(str).toLowerCase();
    },

    /**
     * Uppercase the target `str`.
     */

    upcase : function(str){
      return String(str).toUpperCase();
    },

    /**
     * Sort the target `obj`.
     */

    sort : function(obj){
      return Object.create(obj).sort();
    },

    /**
     * Sort the target `obj` by the given `prop` ascending.
     */

    sort_by : function(obj, prop){
      return Object.create(obj).sort(function(a, b){
        a = a[prop], b = b[prop];
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
      });
    },

    /**
     * Size or length of the target `obj`.
     */

    size : function(obj) {
      return obj.length;
    },

    /**
     * Size or length of the target `obj`.
     */

    length : function(obj) {
      return obj.length;
    },

    /**
     * Add `a` and `b`.
     */

    plus : function(a, b){
      return Number(a) + Number(b);
    },

    /**
     * Subtract `b` from `a`.
     */

    minus : function(a, b){
      return Number(a) - Number(b);
    },

    /**
     * Multiply `a` by `b`.
     */

    times : function(a, b){
      return Number(a) * Number(b);
    },

    /**
     * Divide `a` by `b`.
     */

    divided_by : function(a, b){
      return Number(a) / Number(b);
    },

    /**
     * Join `obj` with the given `str`.
     */

    join : function(obj, str){
      return obj.join(str || ', ');
    },

    /**
     * Truncate `str` to `len`.
     */

    truncate : function(str, len){
      str = String(str);
      return str.substr(0, len);
    },

    /**
     * Truncate `str` to `n` words.
     */

    truncate_words : function(str, n){
      var str = String(str)
        , words = str.split(/ +/);
      return words.slice(0, n).join(' ');
    },

    /**
     * Replace `pattern` with `substitution` in `str`.
     */

    replace : function(str, pattern, substitution){
      return String(str).replace(pattern, substitution || '');
    },

    /**
     * Prepend `val` to `obj`.
     */

    prepend : function(obj, val){
      return Array.isArray(obj)
        ? [val].concat(obj)
        : val + obj;
    },

    /**
     * Append `val` to `obj`.
     */

    append : function(obj, val){
      return Array.isArray(obj)
        ? obj.concat(val)
        : obj + val;
    },

    /**
     * Map the given `prop`.
     */

    map : function(arr, prop){
      return arr.map(function(obj){
        return obj[prop];
      });
    },

    /**
     * Reverse the given `obj`.
     */

    reverse : function(obj){
      return Array.isArray(obj)
        ? obj.reverse()
        : String(obj).split('').reverse().join('');
    },

    /**
     * Get `prop` of the given `obj`.
     */

    get : function(obj, prop){
      return obj[prop];
    },

    /**
     * Packs the given `obj` into json string
     */
    json : function(obj){
      return JSON.stringify(obj);
    }
  };
  
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
  * Trace to system or console.
  *
  * @param {String} s
  * @api private
  */
  
  function trace(str) {
    if (sys) {
      sys.puts(str);
    } else if (typeof console == "object" && console !== null) {
      console.log(str);
    }
  }
  
  /**
   * Escape the given string of `html`.
   *
   * @param {String} html
   * @return {String}
   * @api private
   */

  function escape(html) {
    return String(html)
      .replace(/&(?!\w+;)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
        , args = parts.shift() || '';
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
   * Parse the given `str` of ejs, returning the function body.
   *
   * @param {String} str
   * @return {String}
   * @api public
   */
  
  var parse = exports.parse = function(str, options){
    var options = options || {}
      , open = options.open || exports.open || '<%'
      , close = options.close || exports.close || '%>';
  
    var buf = [
        "var buf = [];"
      , "\nwith (locals) {"
      , "\n  buf.push('"
    ];
    
    var lineno = 1;
  
    for (var i = 0, len = str.length; i < len; ++i) {
      if (str.slice(i, open.length + i) == open) {
        i += open.length
    
        var prefix, postfix, line = '__stack.lineno=' + lineno;
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
  
        var start = i;
        var end = str.indexOf(close, i);
        var js = str.substring(i, end);
        if (js[0] == ':') js = filtered(js);
        buf.push(prefix, js, postfix);
        i += end - start + close.length - 1;
  
      } else if (str[i] == "\\") {
        buf.push("\\\\");
      } else if (str[i] == "'") {
        buf.push("\\'");
      } else if (str[i] == "\r") {
        buf.push(" ");
      } else if (str[i] == "\n") {
        buf.push("\\n");
        lineno++;
      } else {
        buf.push(str[i]);
      }
    }
  
    buf.push("');\n}\nreturn buf.join('');");
    return buf.join('');
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
    
    var input = JSON.stringify(str)
      , filename = options.filename
          ? JSON.stringify(options.filename)
          : 'undefined';
    
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
    
    if (options.debug) trace(str);
    var fn = new Function('locals, filters, escape', str);
    return function(locals){
      return fn.call(this, locals, filters, escape);
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
}(typeof exports === 'undefined' ? this['EJS']={} : exports));