/**
 * Test render with scope and locals options.
 */

var ejs = require('..');
var assert = require('should');

function trim(astr) {
  return astr.replace(/\s+/g,' ').trim();
}

describe('ejs.render(str, options).', function(){
  it('document the use of global variable', function(){
    NAME = 'TOBI';  // global
    ejs.render('<p><%= NAME %></p>').should.equal('<p>TOBI</p>');
  });

  it('should accept locals', function(){
    ejs.render('<p><%= name %></p>', { name: 'loki' })
      .should.equal('<p>loki</p>');
  });

  it('should accept "locals"', function(){
    ejs.render('<p><%= name %></p>',
      {locals: { name: 'loki'}}).should.include('loki');
  });

  it('should use locals before "locals"', function(){
    ejs.render('<p><%= name %></p>',
      {name: 'tobi', locals: { name: 'loki'}}).should.include('tobi');
  });

  it('should not use base variable', function(){
    var name = 'tobi';
    ejs.render('<p><%= this.name %></p>').should.equal('<p>undefined</p>');
  });

  it('should accept "this" via "scope"', function(){
    ejs.render('<p><%= this.name %></p>',
      {scope: { name: 'tobi'}}).should.include('tobi');
  });

  it('should accept both "locals" and "scope"', function(){
    var x = ejs.render('<p><%= name1 %><%= this.name %></p>',
      {scope: { name: 'tobi'}, locals: { name1: 'loki'}});
    x.should.include('tobi');
    x.should.include('loki');
  });

  it('should work with client option ', function(){
    var x = ejs.render('<p><%= name1 %><%= this.name %></p>',
      {client: true, scope: { name: 'tobi'}, locals: { name1: 'loki'}});
    x.should.include('tobi');
    x.should.include('loki');
  });
});

describe('Named function using locals.', function(){
  var tplstr = function () {/*
  <% function fn() { %>
    <% return a %>
  <% } %>
  <%= fn() %>
  */
  }.toString().match(/\/\*([^]*)\*\/$/m)[1];
  it('should render using local', function(){
    trim(ejs.render(tplstr, {a: "1"})).should.equal("1");
  });

  it('should render using "local"', function(){
    trim(ejs.render(tplstr, {locals: {a: "1"}})).should.equal("1");
  });

  it('should not render using "scope"', function(){
    (function(){ejs.render(tplstr,
      {scope: {a: "1"}})}).should.throw(/a is not defined/);
  });
});

describe('template with users.map(fn).', function(){
  var tplstr = function () {/*
  <h1>Users</h1>
  <% function fn(user) { %>
    <li><%= user.name %></li>
  <% } %>
  <ul>
    <% users.map(fn) %>
  </ul>
  */
  }.toString().match(/\/\*([^]*)\*\/$/m)[1];
  var html = function () {/*
  <h1>Users</h1>
  <ul>
    <li>tobi</li>
    <li>loki</li>
    <li>jane</li>
  </ul>
  */
  }.toString().match(/\/\*([^]*)\*\/$/m)[1];
  html = trim(html);
  var users = [{ name: 'tobi' }, { name: 'loki' }, { name: 'jane' }];
  it('should render with local', function(){
    var x = ejs.render(tplstr, {users: users});
    trim(x).should.equal(html);
  });

  it('should render with "locals"', function(){
    var x = ejs.render(tplstr, {locals: {users: users}});
    trim(x).should.equal(html);
  });
});

describe('template with "this" in named function.', function(){
  var tplstr = function () {/*
  <h1>Users <%= this.label %>s</h1>
  <% function user(user) { %>
    <li><%= user.name + ' is a ' + this.label %></li>
  <% } %>
  <% user = user.bind(this) %>
  <ul>
    <% users.map(user) %>
  </ul>
  */
  }.toString().match(/\/\*([^]*)\*\/$/m)[1];
  var html = function () {/*
  <h1>Users pets</h1>
  <ul>
    <li>tobi is a pet</li>
    <li>loki is a pet</li>
    <li>jane is a pet</li>
  </ul>
  */
  }.toString().match(/\/\*([^]*)\*\/$/m)[1];
  html = trim(html);
  var users = [{ name: 'tobi' }, { name: 'loki' }, { name: 'jane' }];
  it('should compile and run', function(){
    var fn = ejs.compile(tplstr);
    var x = fn({users: users, label: 'pet'});
    x.should.include('undefined');
    x = fn.call({label: 'pet'}, {users: users});
    trim(x).should.equal(html);
  });

  it('should render with local and "scope"', function(){
    var x = ejs.render(tplstr,
      {users: users, scope: {label: 'pet'}});
    trim(x).should.equal(html);
  });

  it('should render with "locals" and "scope"', function(){
    var x = ejs.render(tplstr,
      {locals: {users: users}, scope: {label: 'pet'}});
    trim(x).should.equal(html);
  });
});
