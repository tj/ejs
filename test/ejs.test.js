
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
    },
    
    'test `scope` option': function(assert){
        var html = '<p>tj</p>',
            str = '<p><%= this %></p>';
        assert.equal(html, ejs.render(str, { scope: 'tj' }));
    },
    
    'test `context` option': function(assert){
        var html = '<p>tj</p>',
            str = '<p><%= this %></p>';
        assert.equal(html, ejs.render(str, { context: 'tj' }));
    },
    
    'test escaping': function(assert){
        assert.equal('&lt;script&gt;', ejs.render('<%= "<script>" %>'));
        assert.equal('<script>', ejs.render('<%- "<script>" %>'));
    }
};