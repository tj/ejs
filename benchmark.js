

var ejs = require('./lib/ejs'),
    str = '<% if (foo) { %><p><%= foo %></p><% } %>',
    times = 5000;

console.log('rendering ' + times + ' times');

var start = new Date;
while (times--) {
    ejs.render(str, { locals: { foo: 'bar' }});
}

console.log('took ' + (new Date - start) + 'ms');