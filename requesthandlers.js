var config = require("./config");
var util = require("./util");
var fs = require('fs');

// TODO: data and processors should be part of objects so each instance of the status server can run infinte status boards
// TODO: cache the json stringified version of the data (and reset on version change)

var fileCache = {}; // unlimited cache of files (not recommended for mammoth sites haha)

///////////
// Handlers prototype (statusBoard, pathname (not inclusive of board id), response, postData)
///////////
function root(statusBoard, response)
{
	console.log("Request handler 'root' was called.");
    var cached = fileCache[config.settings.indexfile];
    if(typeof cached !== 'undefined')
    {
        respondWithContents(response, cached);
    }
    else
    {
        fs.readFile(config.settings.indexfile, {encoding:'utf8'}, function (indexFileErr, indexFileData)
        {
            // TODO an actual error
            if (indexFileErr) throw indexFileErr;
            fs.readFile(config.settings.jqueryscript, {encoding:'utf8'}, function (jqueryFileErr, jqueryFileData)
            {
                // TODO an actual error
                if (jqueryFileErr) throw jqueryFileErr;
                var combinedIndex = indexFileData.toString().replace('<!--JQUERYSCRIPT-->', '<script>' + jqueryFileData + '</script>')
                fileCache[config.settings.indexfile] = combinedIndex;
                respondWithContents(response, combinedIndex);
            });
        });
    }
}

function sendUpdate(statusBoard, response)
{
    var data = JSON.stringify(statusBoard, dataReplacer);
    console.log('Sending: ' + data);
    respondWithContents(response, data);
}

function getDataVersion(statusBoard, response)
{
    respondWithContents(response, '' + statusBoard.v);
}

function pushUpdate(statusBoard, response, postData)
{
	console.log('POSTDATA:' + postData);
    var updateData;
    try
    {
        updateData = postData.data;
    }
    catch(e)
    {
        console.log(e);
        // TODO: some error to the client ?
        respondWithContents(response);
        return;
    }

    for(var idx = 0, len = updateData.s.length; idx < len; idx++)
    {
        var sourceObj = updateData.s[idx];
        var targetObj = statusBoard.smap[sourceObj.i];
        if(typeof targetObj !== 'undefined')
        {
            console.log('Updated data for field: ' + sourceObj.i);
            targetObj.t = sourceObj.t;
            targetObj.v = sourceObj.v;
            statusBoard.v++;
        }
        else
        {
            console.log('Failed to map update data: ' + sourceObj.i);
        }
    }

    respondWithContents(response);
}

exports.root = root;
exports.sendUpdate = sendUpdate;
exports.pushUpdate = pushUpdate;
exports.getDataVersion = getDataVersion;

//////////
// Support
//////////

// TODO: this should be part of the class that manages the statusboard object
function dataReplacer(key, value)
{
    if (key === "smap")
    {
        return undefined;
    }
    return value;
}

function respondWithContents(response, data)
{
    //response.writeHead(200, {"Content-Type": "text/plain"});
    response.writeHead(200, {"Content-Type": "text/html"});
    if(typeof data !== 'undefined')
    {
        response.write(data);
    }
    response.end();
}