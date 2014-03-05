var url = require('url');
var util = require('./util');

function postrouter(request, actionFunc, errorFunc)
{
    request.setEncoding('utf8');

    var postData = '';

    request.addListener("data", function(postDataChunk)
    {
        postData += postDataChunk;
    });

    request.addListener("end", function()
    {
        try
        {
            // NOTE: assumes all post data responses from the server are json
            var postObj = JSON.parse(postData);
            actionFunc(postObj);
        }
        catch(err)
        {
            errorFunc();
            // TODO: return error
        }
    });
}

function getrouter(request, actionFunc, errorFunc)
{
    // yawn, pretty dull
    actionFunc(null);
}


function addRouter(routers, id, hasQueryString, func)
{
    routers[id] =
    {
        id:id.toLowerCase(),
        hasQueryString:hasQueryString,
        func:func
    }
}

exports.postrouter = postrouter;
exports.getrouter = getrouter;
// TODO: is there a need for a delete/get router?
exports.deleterouter = getrouter;
exports.addRouter = addRouter;
