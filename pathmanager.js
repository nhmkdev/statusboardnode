var config = require('./config');
var util = require('./util');

function PathManager()
{
    this.processors = {};
}

// function needs to return an object created by getProcessorObject OR as an object just a value created by getProcessorObject
PathManager.prototype.addProcessor = function(path, objOrFunc)
{
    config.logDebug('Adding path processor: ' + path);
    this.processors[path] = objOrFunc;
}

PathManager.prototype.getProcessor = function(urlData, router)
{
    // TODO: probably want some default handler for / requests (?)

    var pathArray = urlData.pathname.split('/');
    if(pathArray.length < 1)
    {
        // TODO: error
        return null;
    }
    // NOTE: hacky? this allows for files to be checked first then object processors
    console.log(urlData.pathname + ':' + router.id);
    var processorData = this.processors[urlData.pathname];
    if(util.defined(processorData) === false)
    {
        processorData = this.processors[pathArray[1]];
    }

    if(util.defined(processorData))
    {
        // NOTE: Path processors support an on-the-fly function to determine the function based on the input data
        // processor data may be in the form of a function or a raw object
        // {
        // func:function(response, postObj, urlData, [additionalArgs]),
        // additionalArgs:[]
        // }
        if(typeof processorData == 'function')
        {
            return processorData(pathArray, urlData, router);
        }
        return processorData;
    }
    else
    {
        config.logDebug('Failed to find processor for: ' + urlData.pathname);
    }
    return null;
}


// func needs to have this prototype: (response, postObj, urlData, additionalargs...)
PathManager.prototype.getProcessorObject = function(func, additionalArgs)
{
    return { f:func, aa:(util.defined(additionalArgs) ? additionalArgs : null) };
}

PathManager.prototype.executeProcessor = function(response, postObj, urlData, processorData)
{
    processorData.f.apply(null, [response, postObj, urlData].concat(processorData.aa));
}
// singleton
module.exports = new PathManager();