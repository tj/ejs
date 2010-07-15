
/**
 * Module dependencies.
 */

var ejs = require('ejs');

module.exports = {
    'test .version': function(assert){
        assert.ok(/^\d+\.\d+\.\d+$/.test(ejs.version), 'Test .version format');
    },
    
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
    },
    
    'test newlines': function(assert){
        var html = '\n<p>tj</p>\n<p>tj@sencha.com</p>',
            str = '<% if (name) { %>\n<p><%= name %></p>\n<p><%= email %></p><% } %>',
            locals = { name: 'tj', email: 'tj@sencha.com' };
        assert.equal(html, ejs.render(str, { locals: locals }));
    },
    
    'test single quotes': function(assert){
        var html = '<p>WAHOO</p>',
            str = '<p><%= up(\'wahoo\') %></p>',
            locals = { up: function(str){ return str.toUpperCase(); }};
        assert.equal(html, ejs.render(str, { locals: locals, debug: true }));
    }
};