module.exports = exports = Channel;

function Channel() {
	this.buf = '';
};

Channel.prototype.push = function(str) {
	this.buf += str;
}

Channel.prototype.toString = function() {
	return this.buf;
}
