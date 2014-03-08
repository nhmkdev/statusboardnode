var util = require('../pathserver/util');
var webutil = require('../pathserver/webutil');
var logger = require('../pathserver/logger');
var pathManager = require('../pathserver/pathmanager');

var siteFiles = require('./sitefiles');
var config = require('./config');
var statusBoardCollection = require('./statusboardcollection');
var StatusBoard = require('./statusboard');

// TODO: this section may break into another file, statusboardhandler?

var pathFunc = {};

function getBoardAndAct(boardId, func, args)
{
    var board = statusBoardCollection[boardId];
    if(util.defined(board))
    {
        logger.logDebug('Calling function on Board: ' + boardId);
        return func.apply(board, args);
    }
    logger.logDebug('Missing Board: ' + boardId);
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
            logger.log('postBoardItem: Unknown action: ' + action);
            // TODO: error
            webutil.return404(response);
        }
    }
    else
    {
        // TODO: error
        logger.log('postBoardItem: action not included in post data');
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

pathManager.addProcessor(
    config.settings.urlPathBoard,
    function(pathArray, urlData, router)
    {
        var args = [];
        var funcName = '';
        if(pathArray.length >= 3)
        {
            // board processing
            funcName += router.method + 'Board';
            args.push(pathArray[2]);
        }
        if(pathArray.length >= 4)
        {
            // board+item processing
            funcName += 'Item';
            args.push(pathArray[3]);
        }
        logger.logDebug('Board Request: ' + '[' + funcName + ']' + pathArray.join());
        var processFunc = pathFunc[funcName];
        // TODO: a method that builds these objs?
        return util.defined(processFunc) ? pathManager.createProcessorDataObject(router.type, processFunc, args) : null;
    });

pathManager.addProcessor(config.settings.urlPathBoards, pathManager.createProcessorDataObject('get', getBoards));

// TODO: SAMPLE TEMP DATA
var testData = StatusBoard.createNew('test', {d:'Test Status Board'});
testData.addItem(null, {t:'text', d:'Test Field', v:{ t: 'test5' }});
testData.addItem(null, {t:'text', d:'Another Field', v:{ t: 'test13'}});
statusBoardCollection['test'] = testData;