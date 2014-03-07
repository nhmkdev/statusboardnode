function RequestHandler()
{
    var routers = {};
    this.addRouter(routers, 'POST', false, post);
    this.addRouter(routers, 'GET', true, get);
    // NOTE: delete and get both do the same thing
    this.addRouter(routers, 'DELETE', true, get);

    this.getRouter = function(requestType)
    {
        return routers[requestType.toLowerCase()];
    }
}

function post(request, actionFunc, errorFunc)
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
            // TODO: move this out of here (nice to have in central but not valid)
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

function get(request, actionFunc, errorFunc)
{
    // yawn, pretty dull
    actionFunc(null);
}

RequestHandler.prototype.addRouter = function(routers, id, hasQueryString, func)
{
    var lower = id.toLowerCase();
    routers[lower] =
    {
        id:lower, // TODO: the name of the variable should be changed...
        hasQueryString:hasQueryString,
        func:func
    }
}

module.exports = new RequestHandler();
