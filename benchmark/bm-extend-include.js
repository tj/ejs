

var ejs = require('../lib/ejs'),
    times = 50000;

console.log('rendering include ' + times + ' times');

var start = new Date;
while (times--) {
    ejs.renderFile("./include.ejs", { cache: true, filename: 'test', locals: { foo: 'bar' }}, function(err, data){
    	if(times == 0){
    		console.log(data);
    	}
    });
}

console.log('took ' + (new Date - start) + 'ms');

times = 50000;

console.log('rendering extend ' + times + ' times');

var start = new Date;
while (times--) {
    ejs.renderFile("./son.ejs", { cache: true, filename: 'test-ext-bm', locals: { foo: 'bar' }}, function(err, data){
    	if(times == 0){
    		console.log(data);
    	}
    });
}

console.log('took ' + (new Date - start) + 'ms');