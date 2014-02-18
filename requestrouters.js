var url = require("url");
var util = require("./util");

function postrouter(handlers, request, response, statusBoard, urlData)
{
    request.setEncoding('utf8');

    var postData = '';

    request.addListener("data", function(postDataChunk)
    {
        postData += postDataChunk;
    });

    request.addListener("end", function()
    {
        //console.log('POSTDATA:' + postData);

        var postObj;
        var requestHandler;
        {
            postObj = JSON.parse(postData);

            if (util.defined(handlers[postObj.action]))
            {
                requestHandler = handlers[postObj.action];
            }
            else
            {
                console.log("No request handler found for " + postObj.action);
                response.writeHead(404, {"Content-Type": "text/plain"});
                response.write("404 Not found");
                response.end();
                return;
            }
        }
        requestHandler.func(statusBoard, response, postObj);
    });
}

function getrouter(handlers, request, response, statusBoard, urlData)
{
    // TODO: further define handlers to allow for non-existent boards? (so add can be implemented!)
    if(typeof(statusBoard) === 'undefined')
    {
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("404 Not found");
        response.end();
        return;
    }
    var action = urlData.query['action'];
    if(typeof action !== 'undefined')
    {
        handlers[action].func(statusBoard, response);
    }
    else
    {
        // this is the request for the main status board page /[boardid]
        handlers['/'].func(statusBoard, response);
    }

}

exports.postrouter = postrouter;
exports.getrouter = getrouter;