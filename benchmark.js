

var ejs = require('./lib/ejs'),
    str = '<% if (foo) { %><p><%= foo %></p><% } %>',
    times = 50000;

console.log('rendering ' + times + ' times');

var start = new Date;
while (times--) {
    ejs.render(str, { cache: true, filename: 'test', locals: { foo: 'bar' }});
}

console.log('took ' + (new Date - start) + 'ms');

ejs.it = true;
var str_it = '<% if (it.foo) { %><p><%= it.foo %></p><% } %>';
times = 50000;
console.log('options.it true: rendering ' + times + ' times');

var start = new Date;
while (times--) {
    ejs.render(str_it, { cache: true, filename: 'test_it_true', locals: { foo: 'bar' }});
}

console.log('took ' + (new Date - start) + 'ms');