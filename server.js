var http = require('http');
var url = require('url');
var config = require('./config');
var util = require('./util');

function start(routers, pathProcessors, port)
{
	function onRequest(request, response)
	{
        var router = routers[request.method];
        if(util.defined(router))
        {
            var urlData = url.parse(request.url, router.hasQueryString);
            var pathArray = urlData.pathname.split('/');
            var processorData = getPathFunction(pathArray, urlData, router, pathProcessors);
            if(processorData == null)
            {
                // TODO: kill off the response
                config.log('Bad path: ' + urlData.pathname)
            }
            else
            {
                router.func(
                    request,
                    function(postObj)
                    {
                        // NOTE: postObj is already json.parsed object
                        processorData.func.apply(null, [response, postObj, urlData].concat(processorData.additionalArgs));
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
            console.log('Unsupported method: ' + request.method)
        }
	}

	http.createServer(onRequest).listen(port);
	console.log("Server has started on port:" + port);
}

// TODO: build a path processor js file to move this type of code out

function getPathFunction(pathArray, urlData, router, pathProcessors)
{
    // TODO: probably want some default handler for / requests
    if(pathArray.length < 1)
    {
        // TODO: error
        return null;
    }
    // NOTE: hacky? this allows for files to be checked first then object processors
    var processorData = pathProcessors[urlData.pathname];
    if(util.defined(processorData) === false)
    {
        processorData = pathProcessors[pathArray[1]];
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
    return null;
}
exports.start = start;