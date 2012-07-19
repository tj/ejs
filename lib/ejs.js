
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
 * @return {String} String containing javascript.
 */
Parser.prototype.parse = function(str, blocks) {
    var blocks = blocks ? blocks : []
      , buf = [ "var buf = [];"
          , "\nwith (locals) {"
          , "\n  buf.push('"];

    var tokens = this.tokenize(str, blocks);
    buf.push.apply(buf, this.convertTokens(tokens, blocks));

    buf.push(["');\n}\nreturn buf.join('');"]);
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
Parser.prototype.convertTokens = function(tokens) {
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
        case 'node':
            buf.push.apply(buf, this.convertTokens(token.children));
            break;
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
      , extNodes = []
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
                            stack.push({token: new Token('node', kwMatch.name, lineno
                                                         , {isArgument: isArgument})
                                      , tokensBuf: tokens
                                      , keyword: this.keyword.block});
                            tokens = [];
                            break;
                        case this.keyword.extends:
                            if (!kwMatch.name) throw new Error('Must specify filename after extends...');
                            var filename = path.join(this.viewsDir, kwMatch.name), extendEjs, node;

                            extendEjs = fs.readFileSync(filename, 'utf8');
                            node = new Token('node', extendEjs, lineno);
                            tokens.push(node);
                            extNodes.push(node);
                            layout = true;
                            break;
                        case this.keyword.include:
                            if (!kwMatch.name) throw new Error('Must specify file to include...');
                            var includedEjs, filename = path.join(this.viewsDir, kwMatch.name);
                            
                            includedEjs = fs.readFileSync(filename, 'utf8');
                            if (this.options.debug) console.log('Including: \n' + includedEjs);
                            tokens.push(new Token('node', includedEjs, lineno, {},  this.tokenize(includedEjs)));
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

    // tokenize unprocessed nodes as well
    for (var i=0; i < extNodes.length; i++) {
        var node = extNodes[i];
        node.children = this.tokenize(node.text, blocks);
    }
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
