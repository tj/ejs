/**
 * Module dependencies.
 */

var ejs = require('..')
  , fs = require('fs')
  , read = fs.readFileSync
  , assert = require('assert');

/**
 * Load fixture `name`.
 */

function fixture(name) {
  return read('test/fixtures/' + name, 'utf8');
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
})

describe('<%=', function(){
  it('should escape', function(){
    ejs.render('<%= name %>', { name: '<script>' })
      .should.equal('&lt;script&gt;');
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
})

describe('includes', function(){
  it('should include ejs', function(){
    var file = 'test/fixtures/include.ejs';
    ejs.render(fixture('include.ejs'), { filename: file, pets: users })
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
})