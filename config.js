var path = require('path');
var fs = require('fs');
var util = require('./util');

exports.settings =
{
	port:8888, // server port
    jqueryscript:'/jquery-2.1.0.min.js', // relative path to the jquery script you want to use
    jqueryuiscript:'/jquery-ui-1.10.4.min.js',
    jqueryuicss:'/jquery-ui-1.10.4.min.css',
    utilscript:'/util.js',
    clientcommunicatorscript:'/clientcommunicator.js',
    clientlayoutcontrollerscript:'/clientlayoutcontroller.js',
    validFiles:{},
    remappedFiles:{},
    postProcessFileFuncs: {},
    // TODO: eventually break this into modes based on type of client (web vs. mobile vs. whatever)
    indexfile:'/index.html', // relative path to index.html file
    debug:true // flag for whether the log various things to the console
};

var extensionMap = {};
extensionMap['.js'] = { type: 'text/javascript', encoding:'utf8' };
extensionMap['.css'] = { type: 'text/css', encoding:'utf8' };
extensionMap['.png'] = { type: 'image/png', encoding: null };
extensionMap['.jpg'] = { type: 'image/jpeg', encoding:null };
extensionMap['.gif'] = { type: 'image/gif', encoding:null };
extensionMap['.html'] = { type: 'text/html', encoding:'utf8' };

var validFiles = {};
addSupportedFile(exports.settings.jqueryscript, validFiles);
addSupportedFile(exports.settings.jqueryuiscript, validFiles);
addSupportedFile(exports.settings.jqueryuicss, validFiles);
addSupportedFile(exports.settings.utilscript, validFiles);
addSupportedFile(exports.settings.clientcommunicatorscript, validFiles);
addSupportedFile(exports.settings.clientlayoutcontrollerscript, validFiles);
addSupportedFolder('./images', validFiles);

var remappedFiles = {};
addSupportedFile(exports.settings.indexfile, remappedFiles,
    function(fileData)
    {
        var combinedIndex = fileData.toString().replace('<!--JQUERYUICSS-->', '<link rel="stylesheet" href="' + exports.settings.jqueryuicss + '">');
        combinedIndex = combinedIndex.replace('<!--JQUERYSCRIPT-->', '<script src="' + exports.settings.jqueryscript + '"></script>');
        combinedIndex = combinedIndex.replace('<!--JQUERYUISCRIPT-->', '<script src="' + exports.settings.jqueryuiscript + '"></script>');
        combinedIndex = combinedIndex.replace('<!--UTILSCRIPT-->', '<script src="' + exports.settings.utilscript + '"></script>');
        combinedIndex = combinedIndex.replace('<!--CLIENTCOMMSCRIPT-->', '<script src="' + exports.settings.clientcommunicatorscript + '"></script>');
        combinedIndex = combinedIndex.replace('<!--CLIENTLAYOUTCRIPT-->', '<script src="' + exports.settings.clientlayoutcontrollerscript + '"></script>');
        return combinedIndex;
    });

function addSupportedFolder(path, fileSet)
{
    var files = fs.readdirSync(path);
    // remove the leading '.' char
    path = path.substring(1);
    for(var idx = 0, len = files.length; idx < len; idx++)
    {
        addSupportedFile(path + '/' + files[idx], fileSet);
    }
}

function addSupportedFile(filePath, fileSet, postProcessFunc)
{
    var ext = path.extname(filePath);
    if(util.defined(extensionMap[ext]))
    {
        fileSet[filePath] = extensionMap[ext];
        if(util.defined(postProcessFunc))
        {
            exports.settings.postProcessFileFuncs[filePath] = postProcessFunc;
        }
    }
    else
    {
        console.log('Unsupported extension - Cannot add: ' + filePath);
    }
}

exports.settings.validFiles = validFiles;
exports.settings.remappedFiles = remappedFiles;
