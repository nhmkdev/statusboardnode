var logger = require('./logger');
var util = require('./util');

/*
 PathManager is basic processor/manager for maintaining url paths and their associated function calls. It is a singleton
 exported for use across a given PathServer.

 Usage - (in the current implementation the only step required outside of the pathserver is #1)
 1) Add a processor using the addProcessor method. For examples see statusboard_paths.js and sitefiles.js
 2) When a request is received and the method type is known the getProcessorDataObject method can be called to
 determine if there is an associated path processor.
 3) If the resulting processor is non-null then the executeProcessor function should be called (after any POST data is
 fully consumed from the client) to process the client request.
 */

/*
 Constructor for PathManager
 */
function PathManager()
{
    this.processors = {};
}

/*
 Adds a url path processor
 @param {object/function} objOrFunc - The object as created by PathManager.prototype.createProcessorDataObject OR a function
 that returns an object created by PathManager.prototype.createProcessorDataObject. Prototype for function is as follows:
 function(pathArray, urlData, router) -- TODO: details of the params
 */
PathManager.prototype.addProcessor = function(urlPath, objOrFunc)
{
    logger.logDebug('Added path processor: ' + urlPath);
    this.processors[urlPath] = objOrFunc;
}

/*
 Removes a given processor
 @param {string} urlPath - The path to remove.
 */
PathManager.prototype.removeProcessor = function(urlPath)
{
    delete this.processors[urlPath];
}

/*
 Gets the processor data associated with the urlData.pathname
 @param {object} urlData - The object to check
 @param {object} router if the object is defined, false otherwise
 @return {function} - The processor function with the following prototype:
 function(response, postObj, urlData, [additionalArgs]) TODO: further details on this
 OR null on error
 */
PathManager.prototype.getProcessorDataObject = function(urlData, router)
{
    // TODO: probably want some default handler for / requests (?)

    var pathArray = urlData.pathname.split('/');
    if(pathArray.length < 1)
    {
        // TODO: error
        return null;
    }
    // NOTE: hacky? this allows for files to be checked first then object processors
    logger.log(urlData.pathname + ':' + router.method);
    var processorData = this.processors[urlData.pathname];
    if(util.defined(processorData) === false)
    {
        logger.logDebug('Testing for sub processor: ' + pathArray[1]);
        // TODO: the '/' makes more sense than not having it in terms of config but still feels like a hack
        processorData = this.processors['/' + pathArray[1]];
        //processorData = this.processors[pathArray[1]];
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
        else if(processorData.method != router.method)
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


/*
 Gets a processor object for use by the PathManager when a request is processed
 @param {string} method - The request method ('get', 'post' etc.)
 @param {function} func - The function to execute when this request should be processed
 func needs to have this prototype: (response, postObj, urlData, additionalargs...)

 @param {array} additionalArgs - Array of additional parameters to pass to the request processor
 @return {object} ProcessorObject for use with the PathManager
 */
PathManager.prototype.createProcessorDataObject = function(method, func, additionalArgs)
{
    return { method:method, func:func, aa:(util.defined(additionalArgs) ? additionalArgs : null) };
}

/*
 Executes the function associated with the processor data object with the input pertaining to the request
 @param {object} response - The response object from the server request
 @param {object} postObj - The postObj from any POST data
 @param {object} urlData - The urlData from the server request
 @param {object} processorDataObject - The processorDataObject created by PathManager.prototype.createProcessorDataObject
 */
PathManager.prototype.executeProcessor = function(response, postObj, urlData, processorDataObject)
{
    // TODO: call is supposed to perform better... could change function prototype to (serverargs, additionalargs)
    processorDataObject.func.apply(null, [response, postObj, urlData].concat(processorDataObject.aa));
}

// singleton
module.exports = new PathManager();