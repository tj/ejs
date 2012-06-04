/*!
 * EJS
 * Copyright(c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('./utils')
  , util = require('util')
  , fs = require('fs')
  , path = require('path');

/**
 * Library version.
 */

exports.version = '0.7.2';

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
      , args = parts.shift() || '';
    if (args) args = ', ' + args;
    return 'filters.' + name + '(' + js + args + ')';
  });
};

/**
 * Description
 *
 * @param {Error} err
 * @param {String} str
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

function extendTemplate(pathToSuper){
    //load

}

function insertTemplate(args, i){
    //insert



}



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

var parse = exports.parse = function(str, options, templateArgs){
  var options = options || {}
    , open = options.open || exports.open || '<%'
    , close = options.close || exports.close || '%>',
    templateEnd,
    templateName,
    templateString,
    parsedTemplateStr,
    args,
    argsFound,
    argName,
    argStart,
    argContentEnd,
    argContent,
    argEnd,
    argJsUntrimmed,
    argReplacement,
    argsJs;

  var buf = ["\n  buf.push('"];

    if(options.debug) {
        console.log('templateArgs=('+util.inspect(templateArgs, false, null)+')');
    }

  if(!templateArgs) {
    //included in another template and must not have trailing and preceding code
    buf = [
      "var buf = [];"
          , "\nwith (locals) {"
          , "\n  buf.push('"
    ];
  }

  //insert mixings
  var mixinStartSym = '<%#',
      strBeforeMixin,
      strAfterMixin,
      mixinStart,
      mixinEnd,
      mixinsJs,
      mixinReplacement;

    mixinStart  = str.indexOf(mixinStartSym);
    while(mixinStart !== -1) {
        mixinEnd = str.indexOf(close, mixinStart);
        mixinsJs = utils.trim(str.substring(mixinStart+mixinStartSym.length, mixinEnd));

        if(options.debug) {
            console.log('mixinsJs=('+mixinsJs+')');
        }

        mixinsJs = options.settings.views ? path.join(options.settings.views, mixinsJs) : mixinsJs;
        mixinReplacement = fs.readFileSync(mixinsJs, 'utf8');

        if(options.debug) {
            console.log('mixinReplacement=(\n'+mixinReplacement+'\n)');
        }

        strBeforeMixin = str.substring(0,
                                     mixinStart
                                    );
        if(options.debug) {
            console.log('strBeforeMixin=(\n'+strBeforeMixin+'\n)');
        }
        strAfterMixin = str.substring(mixinEnd+close.length,
                                    str.length
                                   );
        if(options.debug) {
            console.log('strAfterMixin=(\n'+strAfterMixin+'\n)');
        }

        str = strBeforeMixin + mixinReplacement + strAfterMixin;
        if(options.debug) {
            console.log('str with inserted mixin=(\n'+str+'\n)');
        }
        mixinStart = str.indexOf(mixinStartSym, mixinStart);
  }



  var lineno = 1;


  var argStartSym = '<%~',
      strBeforeArg,
      strAfterArg;
  //replace args
    argStart = str.indexOf(argStartSym);
    while(argStart !== -1) {
        argEnd = str.indexOf(close, argStart);
        argsJs = utils.trim(str.substring(argStart+argStartSym.length, argEnd));

        if(options.debug) {
            console.log('argsJs=('+argsJs+')');
        }

        argReplacement = templateArgs[argsJs];

        strBeforeArg = str.substring(0,
                                     argStart
                                     );

        strAfterArg = str.substring(argEnd+close.length,
                                     str.length
                                    );

        str = strBeforeArg + argReplacement + strAfterArg;
        argStart = str.indexOf(argStartSym, argEnd);
    }

    if (options.debug) {
        console.log('after arg-replacement=(\n'+str+'\n)');
    }

  var consumeEOL = false;
  for (var i = 0, len = str.length; i < len; ++i) {
    if (str.slice(i, open.length + i) == open) {
      i += open.length

      var prefix, postfix, line = '__stack.lineno=' + lineno;
      switch (str.substr(i, 1)) {
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
        case '+':
          templateEnd = str.indexOf(close, i);
          templateName = utils.trim(str.substring(i+1, templateEnd));
          templateName = options.settings.views ? path.join(options.settings.views, templateName) : templateName;

          args = [];
          argStart = str.indexOf("<%+", i);
          while(argStart !== -1) {
              argEnd = str.indexOf(close, argStart);
              argName = utils.trim(str.substring(argStart+"<%+".length, argEnd));
              argContentEnd = str.indexOf("<%+", argEnd);
              argContent = str.substring(argEnd+close.length, argContentEnd);
              args[argName] = argContent;

              argStart = str.indexOf("<%+", argContentEnd+1);
          }
          i = argContentEnd+"<%+".length;

          templateString = fs.readFileSync(templateName, 'utf8');
          parsedTemplateStr = exports.parse(templateString, options, args);

          prefix = "');"+parsedTemplateStr;
          postfix = "; buf.push('";
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

      while (~(n = js.indexOf("\n", n))) n++, lineno++;
      if (js.substr(0, 1) == ':') js = filtered(js);
      buf.push(prefix, js, postfix);
      i += end - start + close.length - 1;

    } else if (str.substr(i, 1) == "\\") {
      buf.push("\\\\");
    } else if (str.substr(i, 1) == "'") {
      buf.push("\\'");
    } else if (str.substr(i, 1) == "\r") {
      buf.push(" ");
    } else if (str.substr(i, 1) == "\n") {
      if (consumeEOL) {
        consumeEOL = false;
      } else {
        buf.push("\\n");
        lineno++;
      }
    } else {
      buf.push(str.substr(i, 1));
    }
  }


  buf.push("')");

  if(!templateArgs) {
    //not included in another template
    buf.push(";\n\n}");
    buf.push("return buf.join('');");
  }

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

  if (options.debug) console.log(str);
  var fn = new Function('locals, filters, escape', str);
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

  try {
    var str = options.cache
      ? cache[key] || (cache[key] = fs.readFileSync(path, 'utf8'))
      : fs.readFileSync(path, 'utf8');

    fn(null, exports.render(str, options));
  } catch (err) {
    fn(err);
  }
};

// express support

exports.__express = exports.renderFile;

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
