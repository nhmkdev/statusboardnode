var util = require("./util");
var http = require("http");
var url = require("url");

// TODO: probably move this data handling etc to another require file
var statusBoards = {};
var testData =
{
    p:'', // password
    f:8, // field counter (unique id for next field)
    v:0, // version of the data (used so clients don't pull the new data if not necessary
    s: // set of fields
        [
            {
                i:5, // field id, server maintains an ever increasing value for this
                t:'text', // type of field
                v:
                {
                    t:'test1'
                } // value of field (may differ based on type)
                // additional fields for types
            },
            {
                i:7,
                t:'text',
                v:
                {
                    t:'test2'
                }
            }
        ],
    smap:{} // mapping object that maps the 'i' property -> to the objects in the array
}

// TODO: this map will need to be maintained
util.createArrayToObjectMap(testData.s, 'i', testData.smap);

statusBoards['/test'] = testData;

function start(routers, handlers, port)
{
	function onRequest(request, response) 
	{
        var router = routers[request.method];
        if(typeof router !== 'undefined')
        {
            var urlData = url.parse(request.url, router.hasQueryString);
            // TODO: in the future the statusboard will need to be checked in the handlers so the 'add' action can exist
            console.log('Board ID: [' + urlData.pathname + ']');
            var statusBoard = statusBoards[urlData.pathname];

            router.func(handlers, request, response, statusBoard, urlData);
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