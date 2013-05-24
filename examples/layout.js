
/**
 * Module dependencies.
 */

var ejs = require('../');

var opts = {
	locals:{
		listType: "names",
		list: "song"
	},
	blocks: {
		list: {
			filename: "./list.ejs",
			locals: {
				names:[
					"matthew",
					"caitlin"
				],
			}
		}
	}
}

ejs.renderFile("./layout.ejs", opts, function(err, html){
	console.log("ERR", err);
	console.log("HTML", html);
});