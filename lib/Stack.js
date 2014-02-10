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
