var ejs = require("../../");

var pets = [{name: "tiger"}];


ejs.renderFile("./grandson.ejs", {debug: true, pets: pets}, function(err, data){
	console.log(data);
});
