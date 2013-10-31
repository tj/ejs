/**
 * Render File Example
 */

var ejs = require('../');

console.log("RENDER FILE EXAMPLE:\n");
var rf_opts = {
	locals:{
		listType: "name"
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

ejs.renderFile("./layout.ejs", rf_opts, function(err, html){
	console.log("ERR", err);
	console.log("HTML", html);
});

/**
 * Render Example
 */
console.log("\n\nRENDER EXAMPLE:\n");
var r_opts = {
	locals:{
		listType: "name"
	},
	blocks: {
		list: {
			template: "<% if (names.length) { %><ul><% names.forEach(function(name){ %><li><%= name %></li><% }) %></ul><% } %>",
			locals: {
				names:[
					"matthew",
					"caitlin"
				],
			}
		}
	}
}

var r = ejs.render("<div><p>Here is a list of <%- listType %>s</p><%- list %></div>", r_opts);
console.log(r);