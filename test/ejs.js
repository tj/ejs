/**
 * Module dependencies.
 */

var ejs = require('..')
  , fs = require('fs')
  , read = fs.readFileSync
  , assert = require('should');

/**
 * Load fixture `name`.
 */

function fixture(name) {
  return read('test/fixtures/' + name, 'utf8').replace(/\r/g, '');
}

/**
 * User fixtures.
 */

var users = [];
users.push({ name: 'tobi' });
users.push({ name: 'loki' });
users.push({ name: 'jane' });

describe('ejs.compile(str, options)', function(){
  it('should compile to a function', function(){
    var fn = ejs.compile('<p>yay</p>');
    fn().should.equal('<p>yay</p>');
  })

  it('should throw if there are syntax errors', function(){
    try {
      ejs.compile(fixture('fail.ejs'));
    } catch (err) {
      err.message.should.include('compiling ejs');

      try {
        ejs.compile(fixture('fail.ejs'), { filename: 'fail.ejs' });
      } catch (err) {
        err.message.should.include('fail.ejs');
        return;
      }
    }

    assert(false, 'compiling a file with invalid syntax should throw an exception');
  })

  it('should allow customizing delimiters', function(){
    var fn = ejs.compile('<p>{= name }</p>', { open: '{', close: '}' });
    fn({ name: 'tobi' }).should.equal('<p>tobi</p>');

    var fn = ejs.compile('<p>::= name ::</p>', { open: '::', close: '::' });
    fn({ name: 'tobi' }).should.equal('<p>tobi</p>');

    var fn = ejs.compile('<p>(= name )</p>', { open: '(', close: ')' });
    fn({ name: 'tobi' }).should.equal('<p>tobi</p>');
  })

  it('should default to using ejs.open and ejs.close', function(){
    ejs.open = '{';
    ejs.close = '}';
    var fn = ejs.compile('<p>{= name }</p>');
    fn({ name: 'tobi' }).should.equal('<p>tobi</p>');

    var fn = ejs.compile('<p>|= name |</p>', { open: '|', close: '|' });
    fn({ name: 'tobi' }).should.equal('<p>tobi</p>');
    delete ejs.open;
    delete ejs.close;
  })

  it('should have a working client option', function(){
    var fn = ejs.compile('<p><%= foo %></p>', { client: true });
    var str = fn.toString();
    eval('var preFn = ' + str);
    preFn({ foo: 'bar' }).should.equal('<p>bar</p>');
  })
})

describe('ejs.render(str, options)', function(){
  it('should render the template', function(){
    ejs.render('<p>yay</p>')
      .should.equal('<p>yay</p>');
  })

  it('should accept locals', function(){
    ejs.render('<p><%= name %></p>', { name: 'tobi' })
      .should.equal('<p>tobi</p>');
  })
})

describe('ejs.renderFile(path, options, fn)', function(){
  it('should render a file', function(done){
    ejs.renderFile('test/fixtures/para.ejs', function(err, html){
      if (err) return done(err);
      html.should.equal('<p>hey</p>');
      done();
    });
  })

  it('should accept locals', function(done){
    var options = { name: 'tj', open: '{', close: '}' };
    ejs.renderFile('test/fixtures/user.ejs', options, function(err, html){
      if (err) return done(err);
      html.should.equal('<h1>tj</h1>');
      done();
    });
  })

  it('should not catch err threw by callback', function(done){
    var options = { name: 'tj', open: '{', close: '}' };
    var counter = 0;
    try {
      ejs.renderFile('test/fixtures/user.ejs', options, function(err, html){
        counter++;
        if (err) {
          err.message.should.not.equal('Exception in callback');
          return done(err);
        }
        throw new Error('Exception in callback');
      });
    } catch (err) {
      counter.should.equal(1);
      err.message.should.equal('Exception in callback');
      done();
    }
  })
})

describe('<%=', function(){
  it('should escape <script>', function(){
    ejs.render('<%= name %>', { name: '<script>' })
      .should.equal('&lt;script&gt;');
  })
  it("should escape '", function(){
    ejs.render('<%= name %>', { name: "The Jones's" })
      .should.equal('The Jones&#39;s');
  })
  it("shouldn't escape &amp;", function(){
    ejs.render('<%= name %>', { name: "Us &amp; Them" })
      .should.equal('Us &amp; Them');
  })
  it("shouldn't escape &#93;", function(){
    ejs.render('<%= name %>', { name: "The Jones&#39;s" })
      .should.equal('The Jones&#39;s');
  })
  it("should escape &foo_bar;", function(){
    ejs.render('<%= name %>', { name: "&foo_bar;" })
      .should.equal('&amp;foo_bar;');
  })
})

describe('<%-', function(){
  it('should not escape', function(){
    ejs.render('<%- name %>', { name: '<script>' })
      .should.equal('<script>');
  })
})

describe('%>', function(){
  it('should produce newlines', function(){
    ejs.render(fixture('newlines.ejs'), { users: users })
      .should.equal(fixture('newlines.html'));
  })
})

describe('-%>', function(){
  it('should not produce newlines', function(){
    ejs.render(fixture('no.newlines.ejs'), { users: users })
      .should.equal(fixture('no.newlines.html'));
  })
})

describe('single quotes', function(){
  it('should not mess up the constructed function', function(){
    ejs.render(fixture('single-quote.ejs'))
      .should.equal(fixture('single-quote.html'));
  })
})

describe('double quotes', function(){
  it('should not mess up the constructed function', function(){
    ejs.render(fixture('double-quote.ejs'))
      .should.equal(fixture('double-quote.html'));
  })
})

describe('backslashes', function(){
  it('should escape', function(){
    ejs.render(fixture('backslash.ejs'))
      .should.equal(fixture('backslash.html'));
  })
})

describe('messed up whitespace', function(){
  it('should work', function(){
    ejs.render(fixture('messed.ejs'), { users: users })
      .should.equal(fixture('messed.html'));
  })
})

describe('filters', function(){
  it('should work', function(){
    var items = ['foo', 'bar', 'baz'];
    ejs.render('<%=: items | reverse | first | reverse | capitalize %>', { items: items })
      .should.equal('Zab');
  })

  it('should accept arguments', function(){
    ejs.render('<%=: users | map:"name" | join:", " %>', { users: users })
      .should.equal('tobi, loki, jane');
  })

  it('should truncate string', function(){
    ejs.render('<%=: word | truncate: 3 %>', { word: 'World' })
      .should.equal('Wor');
  })

  it('should append string if string is longer', function(){
    ejs.render('<%=: word | truncate: 2,"..." %>', { word: 'Testing' })
      .should.equal('Te...');
  })

  it('should not append string if string is shorter', function(){
    ejs.render('<%=: word | truncate: 10,"..." %>', { word: 'Testing' })
      .should.equal('Testing');
  })

  it('should accept arguments containing :', function(){
    ejs.render('<%=: users | map:"name" | join:"::" %>', { users: users })
      .should.equal('tobi::loki::jane');
  })
})

describe('exceptions', function(){
  it('should produce useful stack traces', function(done){
    try {
      ejs.render(fixture('error.ejs'), { filename: 'error.ejs' });
    } catch (err) {
      err.path.should.equal('error.ejs');
      err.stack.split('\n').slice(0, 8).join('\n').should.equal(fixture('error.out'));
      done();
    }
  })

  it('should not include __stack if compileDebug is false', function() {
    try {
      ejs.render(fixture('error.ejs'), {
        filename: 'error.ejs',
        compileDebug: false
      });
    } catch (err) {
      err.should.not.have.property('path');
      err.stack.split('\n').slice(0, 8).join('\n').should.not.equal(fixture('error.out'));
    }
  });
})

describe('includes', function(){
  it('should include ejs', function(){
    var file = 'test/fixtures/include.ejs';
    ejs.render(fixture('include.ejs'), { filename: file, pets: users, open: '[[', close: ']]' })
      .should.equal(fixture('include.html'));
  })

  it('should work when nested', function(){
    var file = 'test/fixtures/menu.ejs';
    ejs.render(fixture('menu.ejs'), { filename: file, pets: users })
      .should.equal(fixture('menu.html'));
  })

  it('should include arbitrary files as-is', function(){
    var file = 'test/fixtures/include.css.ejs';
    ejs.render(fixture('include.css.ejs'), { filename: file, pets: users })
      .should.equal(fixture('include.css.html'));
  })

  it('should pass compileDebug to include', function(){
    var file = 'test/fixtures/include.ejs';
    var fn = ejs.compile(fixture('include.ejs'), { filename: file, open: '[[', close: ']]', compileDebug: false, client: true })
    var str = fn.toString();
    eval('var preFn = ' + str);
    str.should.not.match(/__stack/);
    (function() {
      preFn({ pets: users });
    }).should.not.throw();
  })
})

describe('layout', function() {
  it('should include layout', function(){
    var file = 'test/fixtures/layout.ejs';
    ejs.render(fixture('layout.ejs'), { filename: file, pets: users })
      .should.equal(fixture('layout.html'))
  })

  it('should work when nested', function(){
    var file = 'test/fixtures/layout-nested.ejs';
    ejs.render(fixture('layout-nested.ejs'), { filename: file, pets: users })
      .should.equal(fixture('layout-nested.html'))
  })

  it('should override parent block', function(){
    var file = 'test/fixtures/layout-override.ejs';
    ejs.render(fixture('layout-override.ejs'), { filename: file, pets: users })
      .should.equal(fixture('layout-override.html'))
  })

  it('should work with includes in blocks', function(){
    var file = 'test/fixtures/layout-include-block.ejs';
    ejs.render(fixture('layout-include-block.ejs'), { filename: file, pets: users })
      .should.equal(fixture('layout-include-block.html'))
  })

  it('should work with includes in layouts', function(){
    var file = 'test/fixtures/layout-include-layout.ejs';
    ejs.render(fixture('layout-include-layout.ejs'), { filename: file, pets: users })
      .should.equal(fixture('layout-include-layout.html'))
  })

  it('should work when included', function(){
    var file = 'test/fixtures/layout-included.ejs';
    ejs.render(fixture('layout-included.ejs'), { filename: file, pets: users })
      .should.equal(fixture('layout-included.html'))
  })

  it('should pass compileDebug to layout', function(){
    var file = 'test/fixtures/layout.ejs';
    var fn = ejs.compile(fixture('layout.ejs'), { filename: file, open: '[[', close: ']]', compileDebug: false, client: true })
    var str = fn.toString();
    eval('var preFn = ' + str);
    str.should.not.match(/__stack/);
    (function() {
      preFn({ pets: users });
    }).should.not.throw();
  })

  it('should throw exception if block opened inside block', function(){
    try {
      var file = 'test/fixtures/layout-fail-block.ejs';
      ejs.compile(fixture('layout-fail-block.ejs'), { filename: file, pets: users });
    } catch (err) {
      err.message.should.include('block found');
      return;
    }

    assert(false, 'opening a new block before closing the last one should throw an error');
  })

  it('should throw exception if EOF encountered inside block', function(){
    try {
      var file = 'test/fixtures/layout-fail-eof.ejs';
      ejs.compile(fixture('layout-fail-eof.ejs'), { filename: file, pets: users });
    } catch (err) {
      err.message.should.include('eof found');
      return;
    }

    assert(false, 'ending the file before closing a block should throw an error');
  })
})

describe('comments', function() {
  it('should fully render with comments removed', function() {
    ejs.render(fixture('comments.ejs'))
      .should.equal(fixture('comments.html'));
  })
})


describe('require', function() {
  it('should allow ejs templates to be required as node modules', function() {
      var file = 'test/fixtures/include.ejs'
        , template = require(__dirname + '/fixtures/menu.ejs');
      template({ filename: file, pets: users })
        .should.equal(fixture('menu.html'));
  })
})
