var http = require('http');
var url = require('url');
var logger = require('./logger');
var util = require('./util');
var webutil = require('./webutil');
var pathManager = require('./pathmanager');
var requestHandler = require('./requestmethodhandler');

/*
  Path Server is a basic handler listening for and evaluating requests using the requesthandler and pathManager
  functionality to process requests.
 */

/*
 Starts the path server
 @param {number} port - The port to listen for connections on
 */
function start(port)
{
    /*
     Standard handler for requests based on the http.createserver function
     @param {object} request - See http.createserver documentation
     @param {object} response - See http.createserver documentation
     */
	function onRequest(request, response)
	{
        var router = requestHandler.getRouter(request.method);
        if(util.defined(router))
        {
            var urlData = url.parse(request.url, router.hasQueryString);
            var processorData = pathManager.getProcessorDataObject(urlData, router);
            if(processorData == null)
            {
                // TODO: kill off the response
                logger.log('Bad path: ' + urlData.pathname);
                webutil.return404(response);
            }
            else
            {
                router.func(
                    request,
                    function(postObj)
                    {
                        // NOTE: postObj is already json.parsed object
                        pathManager.executeProcessor(response, postObj, urlData, processorData);
                        //processorData.func.apply(null, [response, postObj, urlData].concat(processorData.additionalArgs));
                    },
                    function()
                    {
                        // TODO: some error passed from the post method (get doesn't cause errors)
                    }
                );
            }
        }
        else
        {
            //TODO: log and return error
            logger.log('Unsupported method: ' + request.method)
        }
	}

	http.createServer(onRequest).listen(port);
    logger.log("Server has started on port:" + port);
}

exports.start = start;