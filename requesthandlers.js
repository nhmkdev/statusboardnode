var config = require("./config");
var fs = require('fs');
var querystring = require("querystring");

var updateCount = 0;
var lastUpdate = 'notta';
var fileCache = {}; // unlimited cache of files (not recommended for mammoth sites haha)

///////////
// Handlers
///////////
function start(pathname, response)
{
	console.log("Request handler 'start' was called.");
	fileReadAndCache('./index.html', response);
}

function update(pathname, response)
{
	response.writeHead(200, {"Content-Type": "text/html"});
	response.write('Update' + (++updateCount) + '<br>LastUpdate: ' + lastUpdate);
	response.end();	
}

function sendUpdate(pathname, response, postData)
{
	console.log('POSTDATA:' + postData);
	lastUpdate = querystring.parse(postData).sampleField;
	response.writeHead(200, {"Content-Type": "text/html"});
	response.end();	
}

function jqueryscript(pathname, response)
{
    fileReadAndCache(config.settings.jqueryscript, response);
}

exports.start = start;
exports.jqueryscript = jqueryscript;
exports.update = update;
exports.sendUpdate = sendUpdate;

//////////
// Support
//////////

function fileReadAndCache(path, response)
{
    // TODO: this will cause the cache to never update unless node.js is run again (make the file object include a datetime stamp?)
    if(typeof fileCache[path] === 'undefined')
    {
        fs.readFile(path, function (err, data)
        {
            // TODO an actual error
            if (err) throw err;
            fileCacheObj = {};
            fileCacheObj.data = data;
            fileCache[path] = fileCacheObj;
            respondWithContents(response, data);
        });
    }
    else
    {
        respondWithContents(response, fileCache[path].data);
    }
}

function respondWithContents(response, data)
{
    //response.writeHead(200, {"Content-Type": "text/plain"});
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(data);
    response.end();
}