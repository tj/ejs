ejs = (function(){

// CommonJS require()

function require(p){
    if ('fs' == p) return {};
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
  , fs = require('fs')
  , path = require('path')
  , XRegExp = require('xregexp').XRegExp;

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
  return js.split('|').reduce(function(js, filter){
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
 * Token, used to represent a token/node during parsing 
 * and contains parsing info related to each token/node.
 */

Token = function (type, text, lineno, meta, children){
    this.type = type;
    this.text = text;
    this.lineno = lineno;
    this.meta = meta;
    this.children = children;
}

/**
 * Parser class groups together functions that are used for 
 * parsing an ejs file.
 *
 * Contructor takes configuration options as parameter.
 * @param options
 * @api public
 */
var Parser = exports.Parser = function(options) {
    this.options = options || {};
    this.delimiter = {
        open    : XRegExp.escape(options.open || exports.open || '<%')
      , close   : XRegExp.escape(options.close || exports.close || '%>')
    };
    this.keyword = {
        block   : 'block'
      , end     : 'end'
      , extends  : 'extends'
      , include : 'include'
    }
    this.viewsDir = options.viewsDir? options.viewsDir : '';
}

/**
 * Parse the given `str` of ejs, returning the function body.
 *
 * @param {String} str The string to parse.
 * @param {Token[]} blocks Blocks defined in the current scope.
 * @param {Boolean} layout Process as a layout file, i.e. no header/footer.
 * @return {String} String containing javascript.
 */
Parser.prototype.parse = function(str, blocks, layout) {
    var blocks = blocks ? blocks : []
      , pre = [ "var buf = [];"
          , "\nwith (locals) {"
          , "\n  buf.push('"]
      , post = ["');\n}\nreturn buf.join('');"];

    var tokens = this.tokenize(str, blocks);
    var buf = this.convertTokens(tokens, blocks);

    if (!layout) {
        buf = pre.concat(buf, post);
    }
    return buf.join('');
}

/**
 * Process tokenized form of the string to parse, convertingtokens to
 * javascript.
 *
 * @param {String} str The string to parse.
 * @param {Token[]} blocks Blocks defined in the current scope.
 * @return {String[]} List of strings corresponding to the input tokens.
 */
Parser.prototype.convertTokens = function(tokens, blocks) {
    var buf = [];
    var consumeEOL = false;
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i]
          , res = ''
          , line = '__stack.lineno=' + token.lineno;

        switch (token.type) {
        case 'literal': 
            res = token.text
            if (consumeEOL) {
                res = XRegExp.replace( res, /\n/, '', 'one');
                consumeEOL = false;
            }
            res = res
                    .replace(/\\/g, "\\\\")
                    .replace(/\'/g, "\\'")
                    .replace(/\r/g, "")
                    .replace(/\n/g, "\\n");
            break;
        case 'code': 
            var prefix = "');" + line + ';'
              , postfix = "; buf.push('"
              , js = token.text;

            if ( token.meta && token.meta.buffered) {
                if (token.meta.escaped) {
                  prefix = "', escape((" + line + ', ';
                  postfix = ")), '";
                } else {
                  prefix = "', (" + line + ', ';
                  postfix = "), '";
                }
                if (token.meta.filtered) {
                  js = filtered(js);
                }
            } 

            res = prefix + js + postfix;
            break;
        case 'consume-EOL':
            consumeEOL = true;
            break;
        case this.keyword.extends:
            var filename = path.join(this.viewsDir, token.text)
              , js = fs.readFileSync(filename, 'utf8');
            res = this.parse(js, blocks, true);
            break;
        case this.keyword.block:
            buf.push.apply(buf, this.convertTokens(token.children, blocks));
        }
        buf.push(res);
    }
    return buf;
}

/**
 * Convert the provided string into a list of tokens/nodes.
 *
 * @param {String} str The string to tokenize.
 * @param {Token[]} blocks Blocks defined in the current scope.
 * @return {Token[]} List of resulting tokens.
 */
Parser.prototype.tokenize = function (str, blocks){
    var tokens = []
      , myBlocks = []
      , lineno = 1
      , stack = []
      , layout = false
      , ejsRE = XRegExp.cache('^(?<op>[=-](?<filter>:)?)?(?<body>.*?)\\s*(?<slurp>-)?$', 'mn')
      , keywordRE = XRegExp.cache('^\\s*((?<end>' 
                                  + this.keyword.end + ')|((?<keyword>('
                                  + this.keyword.extends + ')|('
                                  + this.keyword.block + ')|('
                                  + this.keyword.include +'))(\\s+(?<name>.*?))?))\\s*$', 'mn');

    
    var segments = XRegExp.matchRecursive(str, this.delimiter.open, this.delimiter.close, 'g', 
                                          {valueNames: ['literal', 'open', 'ejs', 'close']});
    for (var i = 0; i < segments.length; i++) {
        var segment = segments[i]
          , slurp = false;

        switch (segment.value) {
        case 'literal':
            tokens.push(new Token('literal', segment.name, lineno));
            break;
        case 'ejs': // ejs block, tokenize it further
            var match = XRegExp.exec(segment.name, ejsRE, 'm');
            if (!match) throw new Error('Incorrect syntax for ejs...'); // should never happen
            if (match.op) {
                tokens.push(new Token('code', match.body, lineno, { buffered: true, 
                                      escaped: match.op[0] == '=' ? true: false, 
                                      filtered: match.filter? true: false }));
            } else  {  
                var kwMatch = XRegExp.exec(match.body, keywordRE, 'm');
                if (kwMatch) {
                    if (kwMatch.keyword) {
                        switch (kwMatch.keyword) { 
                        case this.keyword.block:
                            if (!kwMatch.name) throw new Error('Must specify name for block...');

                            // its a block, collect all susequent segments as children until the match end
                            var isArgument = (layout && stack.length == 0 )? true:false;
                            stack.push({token: new Token(this.keyword.block, kwMatch.name, lineno
                                                         , {isArgument: isArgument})
                                      , tokensBuf: tokens
                                      , keyword: this.keyword.block});
                            tokens = [];
                            break;
                        case this.keyword.extends:
                            if (!kwMatch.name) throw new Error('Must specify filename after extends...');
                            tokens.push(new Token(this.keyword.extends, kwMatch.name, lineno));
                            layout = true;
                            break;
                        case this.keyword.include:
                            if (!kwMatch.name) throw new Error('Must specify file to include...');
                            var filename = path.join(this.viewsDir, kwMatch.name);
                            var includedEjs = fs.readFileSync(filename, 'utf8');
                            if (this.options.debug) console.log('Including: \n' + includedEjs);
                            tokens.push.apply(tokens, this.tokenize(includedEjs));
                            break;
                        default: // should never happen...
                            throw new Error('Invalid keyword: ' + kwMatch.keyword);
                        }
                    } else if (kwMatch.end){
                        var parent = stack.pop();
                        if (!parent) throw new Error('Encountered ' + this.keyword.end + ' without matching block statement.');
                        parent.token.children = tokens;
                        tokens = parent.tokensBuf;

                        if (blocks[parent.token.text]) {
                            tokens.push(blocks[parent.token.text]);
                        } else if (!parent.token.meta.isArgument) {
                            tokens.push(parent.token);
                        } else {
                            myBlocks[parent.token.text] = parent.token;
                        }
                    } else { // should never happen..
                        throw new Error('Unexpected error, probably a bug in the parser!');
                    } 
                } else { //unbuffered code
                    tokens.push( new Token('code', match.body, lineno));
                }
            } 
            if (match.slurp) slurp = true;
            break;

        default:
            // ignore open and close
        }
        if (slurp) { tokens.push(new Token('consume-EOL', '', lineno)); }

        var n = 0;
        while (~(n = segment.name.indexOf("\n", n))) n++, lineno++;
    }

    if(stack.length != 0) throw new Error('Unmatched ' + stack.pop().keyword + ' statment...');

    // send blocks back to parent
    for (var x in myBlocks) { blocks[x] = myBlocks[x];}
    return tokens;
}

/**
 * Parse the given `str` of ejs, returning the function body.
 *
 * @param {String} str
 * @return {String}
 * @api public
 */
var parse = exports.parse = function(str, options){
    return new Parser(options).parse(str);
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

exports.truncate = function(str, len){
  str = String(str);
  return str.substr(0, len);
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
    .replace(/&(?!\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};
 
}); // module: utils.js

 return require("ejs");
})();