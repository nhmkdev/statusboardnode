var fs = require('fs');
var path = require('path');

var util = require('../pathserver/util');
var logger = require('../pathserver/logger');
var webutil = require('../pathserver/webutil');
var pathManager = require('../pathserver/pathmanager');

var config = require('./config');

// TODO: consider a pathserver side file that handles basic files...

// TODO: this may belong in a file.js object to keep config truly as a config
var fileCache = {}; // unlimited cache of files (not recommended for mammoth sites haha)

var validFiles = {};
addSupportedFile(config.settings.jqueryscript);
addSupportedFile(config.settings.jqueryuiscript);
addSupportedFile(config.settings.jqueryuicss);
addSupportedFile(config.settings.utilscript);
addSupportedFile(config.settings.clientcommunicatorscript);
addSupportedFile(config.settings.clientlayoutcontrollerscript);
addSupportedFolder('./3rdparty/jqueryui/images');

var remappedFiles = {};

//TODO: using 'path' as a var overlaps with the nodejs path functionality...

function addSupportedFolder(filePath)
{
    var files = fs.readdirSync(filePath);
    // remove the leading '.' char // TODO: THIS IS A HACK
    filePath = filePath.substring(1);
    for(var idx = 0, len = files.length; idx < len; idx++)
    {
        addSupportedFile(filePath + '/' + files[idx], validFiles);
    }
}

function addSupportedFile(filePath, extensionOverride)
{
    var ext = path.extname(filePath);
    var extMapping = config.extensionMap[ext];
    if(util.defined(extMapping) || util.defined(extensionOverride))
    {
        validFiles[filePath] = util.defined(extensionOverride) ? extensionOverride : extMapping;
    }
    else
    {
        logger.log('Unsupported extension - Cannot add: ' + filePath);
    }
}

function addRemappedFile(urlPath, filePath, extensionOverride, setupPathProcessor)
{
    remappedFiles[urlPath] = filePath;
    addSupportedFile(urlPath, extensionOverride);
    if(util.getProperty(setupPathProcessor, true))
    {
        // TODO: centralize this call (duplicated in the addPathProcessors function)
        pathManager.addProcessor(urlPath, pathManager.createProcessorDataObject('get', getFile, filePath));
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
        addRemappedFile('/', config.settings.indexfile, extData);
        logger.logDebug('Loaded Index File.');
    }
    catch (error)
    {
        // TODO: shutdown
        logger.logDebug('Index Load Error: ' + error);
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

function addPathProcessors()
{
    loadIndex();
    for(var filePath in validFiles)
    {
        if(validFiles.hasOwnProperty(filePath))
        {
            pathManager.addProcessor(filePath, pathManager.createProcessorDataObject('get', getFile, filePath));
        }
    }
    logger.log('Added sitefiles path processors.');
}

addPathProcessors();

exports.addRemappedFile = addRemappedFile;
