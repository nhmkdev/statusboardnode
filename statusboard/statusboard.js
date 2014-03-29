var fs = require('fs');
var config = require('./config');
var util = require('../pathserver/util');
var logger = require('../pathserver/logger');
var pathManager = require('../pathserver/pathmanager');
var siteFiles = require('./sitefiles');

var statusBoardCollection = {};
var boardSaveData =
{
    boardsToSaveById:new Array(),
    boardVersions:{}
};
//var boardsToSave = new Array();


// TODO: make this a config option
var boardDataPath = './boardfiles/';
var boardSaveInterval = 10000;
// TODO: these should remain as just raw functions to avoid conflicting...?
// TODO: move the collection into this file and delete the other...

/*
 Status board constructor
 @param {string} boardId - The board identifier (used in the url to access)
 @param {string} description - The description of the board
 */
function StatusBoard(boardId, description)
{
    this.v = 0; // version of data
    this.i = 0; // item counter
    this.s = []; // field set
    this.id = boardId;
    this.d = description;
    this.smap = {}; // mapping of the items by 'i' field into the set array
}

StatusBoard.loadFromObject = function(boardObj)
{
    if(util.hasAllProperties(boardObj, 'id', 'd'))
    {
        var board = new StatusBoard(boardObj.id, boardObj.d);
        board.s = boardObj.s;
        board.v = boardObj.v;
        board.i = boardObj.i;
        return board;
    }
    else
    {
        logger.log("Loaded board object missing id or d field.")
    }
    return null;
}

/*
 Validates whether the board id is formatted correctly
 @param {string} boardId - The id to validate
 */
StatusBoard.validateId = function(boardId)
{
    return RegExp('^(\\w){1,32}$','g').test(boardId);
}

/*
 Creates a new status board.
 @param {string} boardId - The object to check
 @param {object} boardObj - A status board object
 @return {object/false} - The status board object OR false on error
 */
StatusBoard.addExisting = function(boardId, boardObj)
{
    if(StatusBoard.validateId(boardId))
    {
        statusBoardCollection[boardId] = boardObj;
        // update the file remapping and add a processor for this board path
        siteFiles.addRemappedFile('/' + boardId, config.settings.indexfile, config.extensionMap['.html'], true);
        boardSaveData.boardVersions[boardId] = boardObj.v;

        // repopulate the smap
        util.createArrayToObjectMap(boardObj.s, 'i', boardObj.smap);

        return boardObj;
    }
    return false;
}

/*
 Creates a new status board.
 @param {string} boardId - The object to check
 @param {object} postObj - POST data object containing the necessary fields to construct a status board
 @return {object/false} - The status board object OR false on error
 */
StatusBoard.createNew = function(boardId, postObj)
{
    return this.addExisting(boardId, new StatusBoard(boardId, postObj.d));
}

/*
 Increments the version of the status board data
 */
StatusBoard.prototype.incrementVersion = function()
{
    this.v++;
}

/*
 Gets the next identifer for a status board item
 @return {string} - The unique new identifier
 */
StatusBoard.prototype.getNextItemId = function()
{
    return 'i' + this.i++;
}

/*
 Deletes the board
 */
StatusBoard.prototype.deleteSelf = function()
{
    delete statusBoardCollection[this.id];
    pathManager.removeProcessor('/' + this.id);
}

/*
 Updates the board settings
 @param {object} postObj - The post data object containing the fields to update
 */
StatusBoard.prototype.update = function(postObj)
{
    // TODO
    return true;
}

/*
 Adds a new status board item
 @param {string} itemId - (unused) 
 @param {object} postObj - The post data object with the fields to define the new status board item
 */
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

/*
 Moves a status board item
 @param {string} itemId - The item to update
 @param {object} postObj - The post data object with the fields to move the new status board item
 */
StatusBoard.prototype.moveItem = function(itemId, postObj)
{
    var item = this.smap[itemId];
    if(typeof item !== 'undefined')
    {
        var itemIndex = this.s.indexOf(item);
        this.s.splice(itemIndex, 1);
        this.s.splice(postObj.d, 0, item);
        this.incrementVersion();
    }
    else
    {
        console.log('StatusBoard:deleteItem: id not found - [' + itemId + ']');
    }
    // TODO: might want a simple method for getting the index / item
}

/*
 Updates a status board item
 @param {string} itemId - The item to update
 @param {object} postObj - The post data object with the fields to update the new status board item
 */
StatusBoard.prototype.updateItem = function(itemId, postObj)
{
    logger.logDebug('updateItem called: ' + this.id + ':' + itemId);
    var sourceObj = postObj.d;
    var targetObj = this.smap[itemId];
    if(util.defined(targetObj) && util.defined(sourceObj))
    {
        targetObj.v = sourceObj.v;
        this.incrementVersion();
        if (config.settings.debug) {
            // extra check so as to not waste processing time on the json.stringify calls
            logger.logDebug('updateItems: OldValue:' + JSON.stringify(targetObj.v) + ' NewValue:' + JSON.stringify(sourceObj.v));
        }
    }
    else
    {
        logger.log('Failed to map update data: ' + sourceObj.i);
    }
}

/*
 Deletes the item specified
 @param {string} itemId - The id of the item to delete
 */
StatusBoard.prototype.deleteItem = function(itemId)
{
    var item = this.smap[itemId];
    if(typeof item !== 'undefined')
    {
        console.log('StatusBoard:deleteItem: removing id - [' + itemId + ']');
        var itemIndex = this.s.indexOf(item);
        this.s.splice(itemIndex, 1);
        delete this.smap[itemId];
        this.incrementVersion();
    }
    else
    {
        console.log('StatusBoard:deleteItem: id not found - [' + itemId + ']');
    }
}

/*
 Gets the version of the status board data
 */
StatusBoard.prototype.getDataVersion = function()
{
    return JSON.stringify({ v:this.v });
}

/*
 Gets the board data as JSON
 */
StatusBoard.prototype.getBoardAsJSON = function()
{
    try
    {
        logger.logDebug('getBoardAsJSON: called');
        return JSON.stringify(this, dataReplacer);
    }
    catch(error)
    {
        logger.log('getBoardAsJSON Error: ' + error);
    }
    return false;
}

// TODO: this is for server->client, need another for file save/load

/*
 Data replacement function for JSON conversions (so the client doesn't get duplicate data)
 @param {string} key - The object to check
 @param {object} value - if the object is defined, false otherwise
 */
function dataReplacer(key, value)
{
    if (key === "smap")
    {
        return undefined;
    }
    return value;
}

/*
 Loads all the board data from a file
 */
function loadBoards()
{
    var files = fs.readdirSync(boardDataPath);

    for(var idx = 0, len = files.length; idx < len; idx++)
    {
        var boardData = JSON.parse(fs.readFileSync(boardDataPath + files[idx]));
        var boardId = util.getProperty(boardData['id'], null);
        if(null != boardId)
        {
            var statusBoard = StatusBoard.loadFromObject(boardData);
            var success = (statusBoard == null) ? false : StatusBoard.addExisting(boardId, statusBoard);
            logger.log('Load Board: ' + files[idx] + ' (' + boardId + ') ' + (success ? 'SUCCESSFUL' : 'FAILED'));
        }
    }

    setTimeout(saveBoards, boardSaveInterval);
}

/*
 Saves all the board data to a file
 */
function saveBoards()
{
    boardSaveData.boardsToSaveById = new Array();
    for(var key in statusBoardCollection)
    {
        if(statusBoardCollection.hasOwnProperty(key))
        {
            var board = statusBoardCollection[key];
            //console.log(boardSaveData.boardVersions[key] + '!=' + board.v);
            if(boardSaveData.boardVersions[key] != board.v)
            {
                boardSaveData.boardsToSaveById.push(key);
            }
        }
    }
    // even if no items are queued up the save board will trigger saveBoards after the interval
    saveBoard(0);
}

/*
 Saves an individual board from the boardSaveData.boardsToSaveById array
 @param index - index of the board to attempt to save
 */
function saveBoard(index)
{
    logger.logDebug('saveBoard evaluating index: ' + index);
    var boardId = util.getProperty(boardSaveData.boardsToSaveById[index], null);
    if(boardId != null)
    {
        if(statusBoardCollection.hasOwnProperty(boardId))
        {
            var boardData = statusBoardCollection[boardId];
            boardSaveData.boardVersions[boardId] = boardData.v;
            logger.log('Saving Board: ' + boardId);
            fs.writeFile(boardDataPath + boardData.id, JSON.stringify(boardData, dataReplacer), function()
            {
                setTimeout(function() { saveBoard(index+1); }, 1);
            });
        }
    }
    else
    {
        logger.log('All boards saved. Waiting ' + boardSaveInterval + '...');
        setTimeout(saveBoards, boardSaveInterval);
    }
}

loadBoards();

exports.StatusBoard = StatusBoard;
exports.StatusBoardCollection = statusBoardCollection;