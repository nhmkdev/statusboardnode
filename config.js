var util = require("./util");

exports.settings =
{
	port:8888, // server port
    jqueryscript:'/jquery-2.1.0.min.js', // relative path to the jquery script you want to use
    jqueryuiscript:'/jquery-ui-1.10.4.min.js',
    jqueryuicss:'/jquery-ui-1.10.4.min.css',
    validFiles:{},
    // TODO: eventually break this into modes based on type of client (web vs. mobile vs. whatever)
    indexfile:'/index.html', // relative path to index.html file
    debug:true // flag for whether the log various things to the console
};

var validFiles = {};
validFiles[exports.settings.jqueryscript] = true;
validFiles[exports.settings.jqueryuiscript] = true;
validFiles[exports.settings.jqueryuicss] = true;

exports.settings.validFiles = validFiles;