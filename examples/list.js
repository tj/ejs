
/**
 * Module dependencies.
 */

let ejs = require('../')
  , fs = require('fs')
  , str = fs.readFileSync(__dirname + '/list.ejs', 'utf8');

let ret = ejs.render(str, {
  names: ['foo', 'bar', 'baz']
});

console.log(ret);
