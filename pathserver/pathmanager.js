var logger = require('./logger');
var util = require('./util');

function PathManager()
{
    this.processors = {};
}

// function needs to return an object created by getProcessorObject OR as an object just a value created by getProcessorObject
PathManager.prototype.addProcessor = function(urlPath, objOrFunc)
{
    logger.logDebug('Added path processor: ' + urlPath);
    this.processors[urlPath] = objOrFunc;
}

PathManager.prototype.removeProcessor = function(urlPath)
{
    delete this.processors[urlPath];
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
    logger.log(urlData.pathname + ':' + router.id);
    var processorData = this.processors[urlData.pathname];
    if(util.defined(processorData) === false)
    {
        logger.logDebug('Testing for sub processor: ' + pathArray[1]);
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
        else if(processorData.rt != router.id)
        {
            logger.logDebug('Failed to find processor for: ' + urlData.pathname + ':' + processorData.rt + ':' + router.type);
            return null;
        }
        return processorData;
    }
    else
    {
        logger.logDebug('Failed to find processor for: ' + urlData.pathname);
    }
    return null;
}


// func needs to have this prototype: (response, postObj, urlData, additionalargs...)
PathManager.prototype.getProcessorObject = function(requestType, func, additionalArgs)
{
    return { rt:requestType, f:func, aa:(util.defined(additionalArgs) ? additionalArgs : null) };
}

PathManager.prototype.executeProcessor = function(response, postObj, urlData, processorData)
{
    processorData.f.apply(null, [response, postObj, urlData].concat(processorData.aa));
}
// singleton
module.exports = new PathManager();