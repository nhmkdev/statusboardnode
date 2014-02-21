var url = require("url");
var util = require("./util");

// TODO: consider another way to get the required information from the routers to make the call in the server

function postrouter(request, urlData, actionFunc, errorFunc)
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
            // NOTE: assumes all post data is json
            var postObj = JSON.parse(postData);
            actionFunc(postObj.action, postObj);
        }
        catch(err)
        {
            errorFunc();
            // TODO: return error
        }
    });
}

function getrouter(request, urlData, actionFunc, errorFunc)
{

    var actionId = urlData.query['action'];
    if(typeof actionId === 'undefined')
    {
        actionId = '/';
    }

    actionFunc(actionId, null);
}

exports.postrouter = postrouter;
exports.getrouter = getrouter;
