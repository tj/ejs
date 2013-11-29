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
