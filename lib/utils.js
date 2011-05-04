
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

var escape_table = {
	'&': '&amp;'
  , '<': '&lt;'
  , '>': '&gt;'
  , '"': '&quot;' 
};

function escape_fn(s) {
	return escape_table[s];
};

exports.escape = function(html){
  return String(html).replace(/[&<>"]/g, escape_fn);
//  return String(html)
//    .replace(/&(?!\w+;)/g, '&amp;')
//    .replace(/</g, '&lt;')
//    .replace(/>/g, '&gt;')
//    .replace(/"/g, '&quot;');
};
 