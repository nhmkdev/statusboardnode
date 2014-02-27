var util = require("./util");
var http = require("http");
var url = require("url");

var StatusBoardObj = require("./statusboard");
var statusBoardCollection = require("./statusboardcollection");

var testData = new StatusBoardObj();
testData.addItem('text', 'Test Field', { t: 'test5' });
testData.addItem('text', 'Another Field', { t: 'test13'});

statusBoardCollection['/test'] = testData;

function start(routers, handlers, port)
{
	function onRequest(request, response)
	{
        var router = routers[request.method];
        if(typeof router !== 'undefined')
        {
            var urlData = url.parse(request.url, router.hasQueryString);
            router.func(request, urlData,
                function(actionId, postObj)
                {
                    var handler = handlers[actionId];
                    if(typeof handler !== 'undefined')
                    {
                        handler.func(urlData, statusBoardCollection, response, postObj);
                    }
                    else
                    {
                        // error response
                    }
                },
                function()
                {
                    // TODO: some error passed from the post method (get doesn't cause errors)
                }
            );
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

exports.start = start;