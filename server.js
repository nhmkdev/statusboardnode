var util = require("./util");
var http = require("http");
var url = require("url");

function start(handlers, port)
{
	function onRequest(request, response) 
	{
		// TODO: probably should pass along the entire request...
		var postData = "";

		var pathname = url.parse(request.url).pathname;
		console.log("Request for " + pathname + " received.");

        var requestHandler;

        // check handlers to see if this is even a valid pathname
        if (util.defined(handlers[pathname]))
        {
            requestHandler = handlers[pathname];
        }
        else
        {
            console.log("No request handler found for " + pathname);
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.write("404 Not found");
            response.end();
            return;
        }

		request.setEncoding(requestHandler.postDataFormat);

		request.addListener("data", function(postDataChunk) 
		{
			postData += postDataChunk;
			//console.log("Received POST data chunk '"+postDataChunk + "'.");
		});

		request.addListener("end", function() 
		{
            requestHandler.handler(pathname, response, postData);
		});
	}

	http.createServer(onRequest).listen(port);
	console.log("Server has started on port:" + port);
}

exports.start = start;