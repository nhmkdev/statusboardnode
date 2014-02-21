var config = require("./config");
var util = require("./util");
var fs = require('fs');

// TODO: data and processors should be part of objects so each instance of the status server can run infinte status boards
// TODO: cache the json stringified version of the data (and reset on version change)

var fileCache = {}; // unlimited cache of files (not recommended for mammoth sites haha)

///////////
// Handlers prototype -- (urlData, statusBoardCollection, response, postData)
///////////
function root(urlData, statusBoardCollection, response)
{
	console.log("Request handler 'root' was called.");
    var cached = fileCache[config.settings.indexfile];
    if(typeof cached !== 'undefined')
    {
        respondWithContents(response, cached, 'text/html');
        //console.log('cache hit!');
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
                respondWithContents(response, combinedIndex, 'text/html');
            });
        });
    }
}

function sendUpdate(urlData, statusBoardCollection, response)
{
    var data = statusBoardCollection[urlData.pathname].getBoardAsJSON();
    console.log('Sending: ' + data);
    respondWithContents(response, data);
}

function getDataVersion(urlData, statusBoardCollection, response)
{
    respondWithContents(response, '' + statusBoardCollection[urlData.pathname].v);
}

function pushItemUpdate(urlData, statusBoardCollection, response, postData)
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

    var statusBoard = statusBoardCollection[urlData.pathname];
    statusBoard.updateItems(updateData.s);
    respondWithContents(response);
}

function addItem(urlData, statusBoardCollection, response, postdata)
{
    var statusBoard = statusBoardCollection[urlData.pathname];
    statusBoard.addItem('text', postdata.v);
    respondWithContents(response);
}

function deleteItem(urlData, statusBoards, response, postdata)
{
    console.log('Deleting Item: [' + postdata.i + ']');
    var statusBoard = statusBoards[urlData.pathname];
    statusBoard.deleteItem(postdata.i);
    respondWithContents(response);
}

function moveItem(urlData, statusBoards, response, postdata)
{
    // TODO: determine how best to handle this...
}

function addBoard(urlData, statusBoards, response)
{

}

function deleteBoard(urlData, statusBoards, response)
{

}

// TODO: just make this return a single object with all the functions mapped into it?
exports.root = root;
exports.sendUpdate = sendUpdate;
exports.pushItemUpdate = pushItemUpdate;
exports.getDataVersion = getDataVersion;
exports.addBoard = addBoard;
exports.addItem = addItem;
exports.deleteItem = deleteItem;

//////////
// Support
//////////

function respondWithContents(response, data, contenttype)
{

    contenttype = util.getProperty(contenttype, 'text/plan');
    //response.writeHead(200, {"Content-Type": "text/plain"});
    response.writeHead(200, {"Content-Type": contenttype});
    if(typeof data !== 'undefined')
    {
        response.write(data);
    }
    response.end();
}