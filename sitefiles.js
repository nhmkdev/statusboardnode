var fs = require('fs');
var path = require('path');

var util = require('./util');
var config = require("./config");
var webutil = require('./webutil');

// TODO: this may belong in a file.js object to keep config truly as a config
var fileCache = {}; // unlimited cache of files (not recommended for mammoth sites haha)

var validFiles = {};
addSupportedFile(config.settings.jqueryscript, validFiles);
addSupportedFile(config.settings.jqueryuiscript, validFiles);
addSupportedFile(config.settings.jqueryuicss, validFiles);
addSupportedFile(config.settings.utilscript, validFiles);
addSupportedFile(config.settings.clientcommunicatorscript, validFiles);
addSupportedFile(config.settings.clientlayoutcontrollerscript, validFiles);
addSupportedFolder('./images', validFiles);

var remappedFiles = {};

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

function addSupportedFile(filePath, fileSet, extOverride)
{
    var ext = path.extname(filePath);
    var extMapping = config.extensionMap[ext];
    if(util.defined(extMapping) || util.defined(extOverride))
    {
        fileSet[filePath] = util.defined(extOverride) ? extOverride : extMapping;
    }
    else
    {
        console.log('Unsupported extension - Cannot add: ' + filePath);
    }
}

// TODO: this does not resolve the problem of loading the board...
function loadIndex()
{
    try
    {
        // blocking -- if this file is missing nothing will work!
        var extData = config.extensionMap['.html'];
        var fileData = fs.readFileSync('.' + config.settings.indexfile, {encoding:extData.encoding});
        var combinedIndex = fileData.toString().replace('<!--JQUERYUICSS-->', '<link rel="stylesheet" href="' + config.settings.jqueryuicss + '">');
        combinedIndex = combinedIndex.replace('<!--JQUERYSCRIPT-->', '<script src="' + config.settings.jqueryscript + '"></script>');
        combinedIndex = combinedIndex.replace('<!--JQUERYUISCRIPT-->', '<script src="' + config.settings.jqueryuiscript + '"></script>');
        combinedIndex = combinedIndex.replace('<!--UTILSCRIPT-->', '<script src="' + config.settings.utilscript + '"></script>');
        combinedIndex = combinedIndex.replace('<!--CLIENTCOMMSCRIPT-->', '<script src="' + config.settings.clientcommunicatorscript + '"></script>');
        combinedIndex = combinedIndex.replace('<!--CLIENTLAYOUTCRIPT-->', '<script src="' + config.settings.clientlayoutcontrollerscript + '"></script>');
        indexData = combinedIndex;
        fileCache[config.settings.indexfile] = indexData;
        addSupportedFile('/', validFiles, extData);
        // TODO: function for setting this up?
        remappedFiles['/'] = config.settings.indexfile;
        config.logDebug('Loaded Index File.');
    }
    catch (error)
    {
        // TODO: shutdown
        config.logDebug('Index Load Error: ' + error);
    }
}

// TODO: rename validFiles to fileSettings?
function getFile(response, postData, urlData)
{
    var fileSettings = validFiles[urlData.pathname];
    var fileToGet = util.defined(remappedFiles[urlData.pathname]) ? remappedFiles[urlData.pathname] : urlData.pathname;
    if(util.defined(fileSettings) === false)
    {
        // TODO: bad file
        webutil.return404();
        return;
    }

    var cached = fileCache[fileToGet];
    if(typeof cached !== 'undefined')
    {
        webutil.respondWithContents(response, cached, fileSettings.type);
        //console.log('cache hit!');
    }
    else
    {
        fs.readFile('.' + fileToGet, {encoding:fileSettings.encoding}, function (fileErr, fileData)
        {
            // TODO an actual error
            if (fileErr) throw fileErr;

            fileCache[fileToGet] = fileData;
            webutil.respondWithContents(response, fileData, fileSettings.type);
        });
    }
}

function addPathProcessor(pathProcessors)
{
    loadIndex();
    for(var path in validFiles)
    {
        if(validFiles.hasOwnProperty(path))
        {
            config.logDebug('addPathProcessor: ' + path);
            pathProcessors[path] = { func:getFile, additionalArgs:[path] };
        }
    }
}

exports.addPathProcessor = addPathProcessor;