var ejs = require('./');
var Benchmark = require('benchmark');

var TPL = '\
<% if (locals.user) { %>\n\
  <h2>hello, <%= locals.user.name %> <%= locals.user.not_exists %></h2>\n\
  <p><%- locals.user.title %></p>\n\
<% } %>';

var render = ejs.compile(TPL, {debug: false});
var render_ParsePlus = ejs.compile(TPL, {parsePlus: true, debug: false});
var renderNoCompileDebug = ejs.compile(TPL, {compileDebug: false, debug: false});
var renderNoWith = ejs.compile(TPL, {_with: false, debug: false});
var render_ParsePlus_NoWith = ejs.compile(TPL, {parsePlus: true, _with: false, debug: false});
console.log('renderNoCompileDebugNoWith source:\n');
var renderNoCompileDebugNoWith = ejs.compile(TPL, {_with: false, compileDebug: false, debug: true});
console.log('--------------------------------------------------------------');
console.log('render_ParsePlus_NoCompileDebugNoWith source:\n');
var render_ParsePlus_NoCompileDebugNoWith = ejs.compile(TPL, {parsePlus: true, _with: false, compileDebug: false, debug: true});
console.log('--------------------------------------------------------------');

var data = {user: {name: 'fengmk2'}};

var s = render(data);
console.log('render:', s);
s = renderNoWith(data);
console.log('renderNoWith:', s);
s = renderNoCompileDebug(data);
console.log('renderNoCompileDebug:', s);
s = renderNoCompileDebugNoWith(data);
console.log('renderNoCompileDebugNoWith:', s);
s = render_ParsePlus_NoWith(data);
console.log('render_ParsePlus_NoWith:', s);
s = render_ParsePlus(data);
console.log('render_ParsePlus:', s);
s = render_ParsePlus_NoCompileDebugNoWith(data);
console.log('render_ParsePlus_NoCompileDebugNoWith:', s);

var suite = new Benchmark.Suite();

suite.add('render()', function () {
  render(data);
}).add('renderNoCompileDebug()', function () {
  renderNoCompileDebug(data);
}).add('renderNoWith()', function () {
  renderNoWith(data);
}).add('renderNoCompileDebugNoWith()', function () {
  renderNoCompileDebugNoWith(data);
}).add('render_ParsePlus()', function () {
  render_ParsePlus(data);
}).add('render_ParsePlus_NoWith()', function () {
  render_ParsePlus_NoWith(data);
}).add('render_ParsePlus_NoCompileDebugNoWith()', function () {
  render_ParsePlus_NoCompileDebugNoWith(data);
});

suite.on('cycle', function (event) {
  console.log(String(event.target));
})
.on('complete', function () {
  console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})
.run({ async: true });
