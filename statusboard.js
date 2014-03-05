var config = require('./config');
var util = require("./util");
var webutil = require("./webutil");
var statusBoardCollection = require("./statusboardcollection");

function StatusBoard(id, description)
{
    this.v = 0; // version of data
    this.i = 0; // item counter
    this.s = []; // field set
    this.id = id;
    this.d = description;
    this.smap = {}; // mapping of the items by 'i' field into the set array
}

StatusBoard.validateId = function(id)
{
    // TODO: validate id scheme for board
    return true;
}

StatusBoard.createNew = function(boardId, postObj)
{
    if(StatusBoard.validateId(boardId))
    {
        statusBoardCollection[boardId] = new StatusBoard(boardId, postObj.d);
    }
    return false;
}

StatusBoard.prototype.incrementVersion = function()
{
    this.v++;
}

StatusBoard.prototype.getNextItemId = function()
{
    return 'i' + this.i++;
}

StatusBoard.prototype.deleteSelf = function()
{
    delete statusBoardCollection[this.id];
}

StatusBoard.prototype.update = function(postObj)
{
    return true;
}

StatusBoard.prototype.addItem = function(itemId, postObj)
{
    // TODO: value validation so people don't send up a bunch of random crap into a board

    var newItem =
    {
        i:this.getNextItemId(),
        t:postObj.t,
        d:postObj.d,
        v:postObj.v
    }
    this.s.push(newItem);
    this.smap[newItem.i] = newItem;
    this.incrementVersion();
}

StatusBoard.prototype.moveItem = function(id, destination)
{
    var item = this.smap[id];
    if(typeof item !== 'undefined')
    {
        var itemIndex = this.s.indexOf(item);
        this.s.splice(itemIndex, 1);
        this.s.splice(destination, 0, item);
        this.incrementVersion();
    }
    else
    {
        console.log('StatusBoard:deleteItem: id not found - [' + id + ']');
    }
    // TODO: might want a simple method for getting the index / item
}

StatusBoard.prototype.deleteItem = function(id)
{
    var item = this.smap[id];
    if(typeof item !== 'undefined')
    {
        console.log('StatusBoard:deleteItem: removing id - [' + id + ']');
        var itemIndex = this.s.indexOf(item);
        this.s.splice(itemIndex, 1);
        delete this.smap[id];
        this.incrementVersion();
    }
    else
    {
        console.log('StatusBoard:deleteItem: id not found - [' + id + ']');
    }
}

StatusBoard.prototype.updateItem = function(itemId, postObj)
{
    config.logDebug('updateItem called: ' + this.id + ':' + itemId);
    var sourceObj = postObj.d;
    var targetObj = this.smap[itemId];
    if(util.defined(targetObj) && util.defined(sourceObj))
    {
        // TODO: any need for allowing type to change?
        //targetObj.t = sourceObj.t;
        targetObj.v = sourceObj.v;
        this.incrementVersion();
        if(config.settings.debug)
        {
            // extra check so as to not waste processing time on the json.stringify calls
            config.logDebug('updateItems: OldValue:' + JSON.stringify(targetObj.v) + ' NewValue:' + JSON.stringify(sourceObj.v));
        }
    }
    else
    {
        console.log('Failed to map update data: ' + sourceObj.i);
    }
}

StatusBoard.prototype.getDataVersion = function()
{
    return this.v.toString();
}

StatusBoard.prototype.getBoardAsJSON = function()
{
    try
    {
        config.logDebug('getBoardAsJSON: called');
        return JSON.stringify(this, dataReplacer);
    }
    catch(error)
    {
        config.log('getBoardAsJSON Error: ' + error);
    }
    return false;
}

// TODO: this is for server->client, need another for file save/load
function dataReplacer(key, value)
{
    if (key === "smap")
    {
        return undefined;
    }
    return value;
}

// TODO: this section may break into another file, statusboardhandler?

var pathFunc = {};

function getBoardAndAct(boardId, func, args)
{
    var board = statusBoardCollection[boardId];
    if(util.defined(board))
    {
        config.logDebug('Calling function on Board: ' + boardId /*+ '\n' + func*/);
        return func.apply(board, args);
    }
    config.logDebug('Missing Board: ' + boardId);
    return false;
}

pathFunc.deleteBoard = function(response, postObj, urlData, boardId)
{
    getBoardAndAct(boardId, null, null, StatusBoard.prototype.deleteSelf);
    // removed or not, all is well
    webutil.respondWithContents(response);
}

pathFunc.deleteBoardItem = function(response, postObj, urlData, boardId, itemId)
{
    getBoardAndAct(boardId, StatusBoard.prototype.deleteItem, [itemId]);
    // removed or not, all is well
    webutil.respondWithContents(response);
}

// query params for the get method
var boardQueryActions = {};
boardQueryActions['getdataversion'] = StatusBoard.prototype.getDataVersion;

pathFunc.getBoard = function(response, postObj, urlData, boardId)
{
    var funcToCall = StatusBoard.prototype.getBoardAsJSON;
    var action = urlData.query['action'];
    if(util.defined(action) && util.defined(boardQueryActions[action]))
    {
        funcToCall = boardQueryActions[action];
    }
    // TODO: error handling?
    var result = getBoardAndAct(boardId, funcToCall);
    if(result === false)
    {
        webutil.return404(response);
    }
    else
    {
        webutil.respondWithContents(response, result);
    }
}

/*pathFunc.getBoardItem = function(response, boardId, itemId)
{
    // not really critical for now...
}*/

pathFunc.postBoard = function(response, postObj, urlData, boardId)
{
    var result = getBoardAndAct(boardId, StatusBoard.prototype.update, [postObj]);
    if(result === false)
    {
        // board is new, attempt to create it
        StatusBoard.createNew(boardId, postObj);
        // TODO: correct error
        //webutil.return404(response);
    }
    else
    {
        webutil.respondWithContents(response);
    }
}

var itemActionMap = {};
itemActionMap['moveitem'] = StatusBoard.prototype.moveItem;
itemActionMap['additem'] = StatusBoard.prototype.addItem;
itemActionMap['updateitem'] = StatusBoard.prototype.updateItem;

pathFunc.postBoardItem = function(response, postObj, urlData, boardId, itemId)
{
    // TODO: determine how many REST rules are being broken by this... 
    // Add new item or update existing
    var action = postObj['action'];
    if(util.defined(action))
    {
        var actionFunc = itemActionMap[action];
        if(util.defined(actionFunc))
        {
            result = getBoardAndAct(boardId, actionFunc, [itemId, postObj]);
            // TODO: actually look at the result...
            webutil.respondWithContents(response);
        }
        else
        {
            config.log('postBoardItem: Unknown action: ' + action);
            // TODO: error
            webutil.return404(response);
        }
    }
    else
    {
        // TODO: error
        config.log('postBoardItem: action not included in post data');
        webutil.return404(response);
    }
}

getBoards = function(response, postObj, urlData)
{
    var results = [];
    for(var id in statusBoardCollection)
    {
        if(statusBoardCollection.hasOwnProperty(id))
        {
            var board = statusBoardCollection[id];
            results.push({ i:id, d:board.d});
        }
    }
    webutil.respondWithContents(response, JSON.stringify(results));
}

function addPathProcessor(pathProcessors)
{
    // gets the function to run from this file (no this object required in any case)
    pathProcessors['board'] = function(pathArray, urlData, router)
    {
        var args = [];
        var funcName = '';
        if(pathArray.length >= 3)
        {
            // board processing
            funcName += router.id + 'Board';
            args.push(pathArray[2]);
        }
        if(pathArray.length >= 4)
        {
            // board+item processing
            funcName += 'Item';
            args.push(pathArray[3]);
        }
        config.logDebug('Board Request: ' + '[' + funcName + ']' + pathArray.join());
        var processFunc = pathFunc[funcName];
        // TODO: a method that builds these objs?
        return util.defined(processFunc) ? { func:processFunc, additionalArgs:args } : null;
    }
    pathProcessors['boards'] = { func:getBoards, additionalArgs:null };
}

exports.addPathProcessor = addPathProcessor;

var testData = new StatusBoard('test', 'Test Status Board');
testData.addItem(null, {t:'text', d:'Test Field', v:{ t: 'test5' }});
testData.addItem(null, {t:'text', d:'Another Field', v:{ t: 'test13'}});
statusBoardCollection['test'] = testData;
