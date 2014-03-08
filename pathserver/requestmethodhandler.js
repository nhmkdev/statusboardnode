/*
  Support class that processes the different types of requests (essentially those with and without POST data).
 */

/*
 Constructor for the http request method processing
 */
function RequestMethodHandler()
{
    var routers = {};

    this.getRouter = function(requestType)
    {
        return routers[requestType.toLowerCase()];
    }

    /*
     Adds a method router
     @param {string} method - The method type as a string
     @param {bool} hasQueryString - Flag indicating whether this type of request can include url parameters
     @param {function} func - The function to execute after the request method has been determined (ie. POST data read)
     */
    var addHandler = function(method, hasQueryString, func)
    {
        var methodLower = method.toLowerCase();
        routers[methodLower] =
        {
            method:methodLower, // TODO: the name of the variable should be changed...
            hasQueryString:hasQueryString,
            func:func
        }
    }

    addHandler('POST', false, post);
    addHandler('GET', true, get);
    // NOTE: delete and get both do the same thing
    addHandler('DELETE', true, get);
}

/*
 POST request handler
 @param {object} request - The request object from the http functionality in node
 @param {function} actionFunc - The function to execute on successful processing of the request
 @param {function} errorFunc - The function to execute on error
 */
function post(request, actionFunc, errorFunc)
{
    // TODO: the requests should have more control over the POST data type (probably utf-8 vs. binary would be enough)
    // NOTE: assumes all post data from the client is json
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
            // NOTE: assumes all post data from the client is json
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

/*
 GET request handler (NOTE: this does not call the errorFunc)
 @param {object} request - The request object from the http functionality in node (not used)
 @param {function} actionFunc - The function to execute on successful processing of the request
 @param {function} errorFunc - The function to execute on error (not used)
 */
function get(request, actionFunc, errorFunc)
{
    // yawn, pretty dull
    actionFunc(null);
}

module.exports = new RequestMethodHandler();
