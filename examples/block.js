var ejs = require('../');

/**
 * Render File Example
*/

console.log("\n\nRENDER FILE EXAMPLE:\n");
var rf_opts = {
	locals:{
		listType: "name",
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

ejs.renderFile("./block.ejs", rf_opts, function(err, html){
	console.log("ERR", err);
	console.log("HTML", html);
});


/**
 * Render Example
 */
console.log("\n\nRENDER EXAMPLE:\n");
var opts = {
	listType: "name",
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

var r = ejs.render("<div><p>Here is a list of <%- listType %>s</p><%- block list %></div>", opts);
console.log(r);

 /**/