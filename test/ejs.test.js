
/**
 * Module dependencies.
 */

var ejs = require('ejs');

module.exports = {
    'test .version': function(assert){
        assert.ok(/^\d+\.\d+\.\d+$/.test(ejs.version), 'Test .version format');
        assert.done();
    },
    
    'test html': function(assert){
        assert.equal('<p>yay</p>', ejs.render('<p>yay</p>'));
        assert.done();
    },
    
    'test buffered code': function(assert){
        var html = '<p>tj</p>',
            str = '<p><%= name %></p>',
            locals = { name: 'tj' };
        assert.equal(html, ejs.render(str, { locals: locals }));
        assert.done();
    },
    
    'test unbuffered code': function(assert){
        var html = '<p>tj</p>',
            str = '<% if (name) { %><p><%= name %></p><% } %>',
            locals = { name: 'tj' };
        assert.equal(html, ejs.render(str, { locals: locals }));
        assert.done();
    },
    
    'test `scope` option': function(assert){
        var html = '<p>tj</p>',
            str = '<p><%= this %></p>';
        assert.equal(html, ejs.render(str, { scope: 'tj' }));
        assert.done();
    },
    
    'test escaping': function(assert){
        assert.equal('&lt;script&gt;', ejs.render('<%= "<script>" %>'));
        assert.equal('<script>', ejs.render('<%- "<script>" %>'));
        assert.done();
    },
    
    'test newlines': function(assert){
        var html = '\n<p>tj</p>\n<p>tj@sencha.com</p>',
            str = '<% if (name) { %>\n<p><%= name %></p>\n<p><%= email %></p><% } %>',
            locals = { name: 'tj', email: 'tj@sencha.com' };
        assert.equal(html, ejs.render(str, { locals: locals }));
        assert.done();
    },
    
    'test single quotes': function(assert){
        var html = '<p>WAHOO</p>',
            str = "<p><%= up('wahoo') %></p>",
            locals = { up: function(str){ return str.toUpperCase(); }};
        assert.equal(html, ejs.render(str, { locals: locals }));
        assert.done();
    },

    'test single quotes in the html': function(assert){
        var html = '<p>WAHOO that\'s cool</p>',
            str = '<p><%= up(\'wahoo\') %> that\'s cool</p>',
            locals = { up: function(str){ return str.toUpperCase(); }};
        assert.equal(html, ejs.render(str, { locals: locals }));
        assert.done();
    },

    'test multiple single quotes': function(assert) {
        var html = "<p>couldn't shouldn't can't</p>",
            str = "<p>couldn't shouldn't can't</p>";
        assert.equal(html, ejs.render(str));
        assert.done();
    },

    'test single quotes inside tags': function(assert) {
        var html = '<p>string</p>',
            str = "<p><%= 'string' %></p>";
        assert.equal(html, ejs.render(str));
        assert.done();
    },

    'test back-slashes in the document': function(assert) {
        var html = "<p>backslash: '\\'</p>",
            str = "<p>backslash: '\\'</p>";
        assert.equal(html, ejs.render(str));
        assert.done();
    },
    
    'test double quotes': function(assert){
        var html = '<p>WAHOO</p>',
            str = '<p><%= up("wahoo") %></p>',
            locals = { up: function(str){ return str.toUpperCase(); }};
        assert.equal(html, ejs.render(str, { locals: locals }));
        assert.done();
    },
    
    'test multiple double quotes': function(assert) {
        var html = '<p>just a "test" wahoo</p>',
            str = '<p>just a "test" wahoo</p>';
        assert.equal(html, ejs.render(str));
        assert.done();
    },
    
    'test whitespace': function(assert){
        var html = '<p>foo</p>',
            str = '<p><%="foo"%></p>';
        assert.equal(html, ejs.render(str));

        var html = '<p>foo</p>',
            str = '<p><%=bar%></p>';
        assert.equal(html, ejs.render(str, { locals: { bar: 'foo' }}));
        assert.done();
    },
    
    'test custom tags': function(assert){
        var html = '<p>foo</p>',
            str = '<p>{{= "foo" }}</p>';

        assert.equal(html, ejs.render(str, {
            open: '{{',
            close: '}}'
        }));

        var html = '<p>foo</p>',
            str = '<p><?= "foo" ?></p>';

        assert.equal(html, ejs.render(str, {
            open: '<?',
            close: '?>'
        }));
        assert.done();
    },

    'test custom tags over 2 chars': function(assert){
        var html = '<p>foo</p>',
            str = '<p>{{{{= "foo" }>>}</p>';

        assert.equal(html, ejs.render(str, {
            open: '{{{{',
            close: '}>>}'
        }));

        var html = '<p>foo</p>',
            str = '<p><??= "foo" ??></p>';

        assert.equal(html, ejs.render(str, {
            open: '<??',
            close: '??>'
        }));
        assert.done();
    },
    
    'test global custom tags': function(assert){
        var html = '<p>foo</p>',
            str = '<p>{{= "foo" }}</p>';
        ejs.open = '{{';
        ejs.close = '}}';
        assert.equal(html, ejs.render(str));
        delete ejs.open;
        delete ejs.close;
        assert.done();
    },
    
    'test iteration': function(assert){
        var html = '<p>foo</p>',
            str = '<% for (var key in items) { %>'
                + '<p><%= items[key] %></p>'
                + '<% } %>';
        assert.equal(html, ejs.render(str, {
            locals: {
                items: ['foo']
            }
        }));
        
        var html = '<p>foo</p>',
            str = '<% items.forEach(function(item){ %>'
                + '<p><%= item %></p>'
                + '<% }) %>';
        assert.equal(html, ejs.render(str, {
            locals: {
                items: ['foo']
            }
        }));
        assert.done();
    },
    
    'test filter support': function(assert){
        var html = 'Zab',
            str = '<%=: items | reverse | first | reverse | capitalize %>';
        assert.equal(html, ejs.render(str, {
            locals: {
                items: ['foo', 'bar', 'baz']
            }
        }));
        assert.done();
    },
    
    'test filter argument support': function(assert){
        var html = 'tj, guillermo',
            str = '<%=: users | map:"name" | join:", " %>';
        assert.equal(html, ejs.render(str, {
            locals: {
                users: [
                    { name: 'tj' },
                    { name: 'guillermo' }
                ]
            }
        }));
        assert.done();
    },
    
    'test sort_by filter': function(assert){
        var html = 'tj',
            str = '<%=: users | sort_by:"name" | last | get:"name" %>';
        assert.equal(html, ejs.render(str, {
            locals: {
                users: [
                    { name: 'guillermo' },
                    { name: 'tj' },
                    { name: 'mape' }
                ]
            }
        }));
        assert.done();
    },
    
    'test custom filters': function(assert){
        var html = 'Welcome Tj Holowaychuk',
            str = '<%=: users | first | greeting %>';

        ejs.filters.greeting = function(user){
            return 'Welcome ' + user.first + ' ' + user.last + '';
        };

        assert.equal(html, ejs.render(str, {
            locals: {
                users: [
                    { first: 'Tj', last: 'Holowaychuk' }
                ]
            }
        }));
        assert.done();
    },

    'test render partial ejs': function(assert){
        var html = 'render return a string.',
            str = '<% x = %RENDER%> test <%END%>'
                + 'render return a <%= typeof(x) %>.';
        assert.equal(html, ejs.render(str, {
            locals: {}
        }), 'render partial must return a string');

        var html = 'this is a <b>test</b>.',
            str = 'this is a <%- %RENDER%><b>test</b><%END%>.';
        assert.equal(html, ejs.render(str, {
            locals: {}
        }), 'render partial must support direct free print');

        var html = 'this is a &lt;test&gt;.',
            str = 'this is a <%= %RENDER%><test><%END%>.';
        assert.equal(html, ejs.render(str, {
            locals: {}
        }), 'render partial must support direct escaped print');

        function link_to(url, content) {
            return '<a href="'+url+'">'+content+'</a>'
        }
        function bold(content) {
            return '<b>'+content+'</b>'
        }

        var html = '<a href="some/path"><span>go!</span></a>',
            str = '<%- link_to( link.url, %RENDER%>'
                + '<span><%= link.txt %></span>'
                + '<%END ) %>';
        assert.equal(html, ejs.render(str, {
            locals: {
                link_to: link_to,
                link: { url:'some/path', txt:'go!' }
            }
        }), 'simple partial render');

        var html = '<b> Click: <a href="some/path"><span>go!</span></a></b>',
            str = '<%- bold( %RENDER%> Click: '
                + '<%- link_to(link.url, %RENDER%>'
                + '<span><%= link.txt %></span>'
                + '<%END)%><%END)%>';
        assert.equal(html, ejs.render(str, {
            locals: {
                bold: bold,
                link_to: link_to,
                link: { url:'some/path', txt:'go!' }
            }
        }), 'nested partial render');

        assert.done();
    },

    'test compile partial ejs': function(assert){
        var html = 'compile return a function.',
            str = '<% x = %COMPILE()%> test <%END%>'
                + 'compile return a <%= typeof(x) %>.';
        assert.equal(html, ejs.render(str, {
            locals: {}
        }), 'compile partial must return a function');

        var html = 'this is a <b>test</b>.',
            str = '<% x = %COMPILE(str)%>'
                + '<b><%= str %></b>'
                + '<%END%>this is a <%- x("test") %>.';
        assert.equal(html, ejs.render(str, {
            locals: {}
        }), 'compiled partial must support free print');

        var html = 'this is a &lt;test&gt;.',
            str = '<% x = %COMPILE(str)%>'
                + '<<%= str %>>'
                + '<%END%>this is a <%= x("test") %>.';
        assert.equal(html, ejs.render(str, {
            locals: {}
        }), 'compiled partial must support escaped print');

        function FormBuilder(entity) {
            this.entity = entity;
            this.textField = function(entityAttr) {
                return '<input name="'+entityAttr+'"' +
                       ' value="'+this.entity[entityAttr]+'"/>';
            };
        }
        function form(entity, content_func) {
            return '<form action="/save/id:'+entity.id+'">' +
                   content_func(new FormBuilder(entity)) +
                   '</form>';
        }

        var html = '<form action="/save/id:123">'
                 + 'Name: <input name="fullName" value="Obi-Wan Kenobi"/>'
                 + '</form>',
            str = '<%- form( user, %COMPILE(usrForm)%>'
                + 'Name: <%- usrForm.textField("fullName") %>'
                + '<%END)%>';
        assert.equal(html, ejs.render(str, {
            locals: {
                form: form,
                user: { id:123, fullName:'Obi-Wan Kenobi' }
            }
        }), 'inteligent form');

        assert.done();
    }
};
