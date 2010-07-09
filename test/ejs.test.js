
/**
 * Module dependencies.
 */

var ejs = require('ejs');

module.exports = {
    'test html': function(assert){
        assert.equal('<p>yay</p>', ejs.render('<p>yay</p>'));
    },
    
    'test buffered code': function(assert){
        var html = '<p>tj</p>',
            str = '<p><%= name %></p>',
            locals = { name: 'tj' };
        assert.equal(html, ejs.render(str, { locals: locals }));
    },
    
    'test unbuffered code': function(assert){
        var html = '<p>tj</p>',
            str = '<% if (name) { %><p><%= name %></p><% } %>',
            locals = { name: 'tj' };
        assert.equal(html, ejs.render(str, { locals: locals }));
    }
};