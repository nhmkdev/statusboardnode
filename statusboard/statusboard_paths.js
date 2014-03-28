var util = require('../pathserver/util');
var webutil = require('../pathserver/webutil');
var logger = require('../pathserver/logger');
var pathManager = require('../pathserver/pathmanager');

var config = require('./config');
var sb = require('./statusboard');

var statusBoardCollection = sb.StatusBoardCollection;
var StatusBoard = sb.StatusBoard;

var pathFunc = {};

/*
 Gets the specified board and calls the specified function with arguments
 @param {string} boardId - The id of the board to act upon
 @param {function} func - The function call on the status board
 @param {array} args - Array of arguments for the function
 @return {bool} - The result of the function passed in and/or false on error
 */
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

/*
 Gets the list of status boards
 @param {object} response - The standard node.js response
 @param {object} postObj - The post data object
 @param {object} urlData - The data from node.js url.parse
 */
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

/*
 Deletes the specified board // TODO: untested
 @param {object} response - The standard node.js response
 @param {object} postObj - The post data object
 @param {object} urlData - The data from node.js url.parse
 @param {string} boardId - The id of the board to act upon
 */
pathFunc.deleteBoard = function(response, postObj, urlData, boardId)
{
    getBoardAndAct(boardId, null, null, StatusBoard.prototype.deleteSelf);
    // removed or not, all is well
    webutil.respondWithContents(response);
}

/*
 Deletes the given board item
 @param {object} response - The standard node.js response
 @param {object} postObj - The post data object
 @param {object} urlData - The data from node.js url.parse
 @param {string} boardId - The id of the board to act upon
 @param {string} itemId - The id of the item to act upon
 */
pathFunc.deleteBoardItem = function(response, postObj, urlData, boardId, itemId)
{
    getBoardAndAct(boardId, StatusBoard.prototype.deleteItem, [itemId]);
    // removed or not, all is well
    webutil.respondWithContents(response);
}

// query params for the getBoard method
var boardQueryActions = {};
boardQueryActions['getdataversion'] = StatusBoard.prototype.getDataVersion;

/*
 Gets the board data (TODO: list query params)
 @param {object} response - The standard node.js response
 @param {object} postObj - The post data object
 @param {object} urlData - The data from node.js url.parse
 @param {string} boardId - The id of the board to act upon
 */
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

/*
 POST data handler for a board
 @param {object} response - The standard node.js response
 @param {object} postObj - The post data object
 @param {object} urlData - The data from node.js url.parse
 @param {string} boardId - The id of the board to act upon
 */
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

/*
 POST data handler for a board item
 @param {object} response - The standard node.js response
 @param {object} postObj - The post data object
 @param {object} urlData - The data from node.js url.parse
 @param {string} boardId - The id of the board to act upon
 @param {string} itemId - The id of the item to act upon
 */
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

// configure the path processors
pathManager.addProcessor(
    config.settings.urlPathBoard,
    /*
     Gets the path processor data object by evaluating the internal pathFunc object for matching functions based
     on the url.
     @param {array} pathArray - The url split by '/'
     @param {object} urlData - The data from node.js url.parse
     @param {object} router - The request method handler
     */
    function(pathArray, urlData, router)
    {
        var args = [];
        var funcName = '';
        // NOTE: pathArray[1] is already known to be 'board'
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
        // this kind of check allows for the pathFunc to have things added/removed without other code changes
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