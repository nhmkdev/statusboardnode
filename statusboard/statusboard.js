var config = require('./config');
var util = require('../pathserver/util');
var logger = require('../pathserver/logger');
var pathManager = require('../pathserver/pathmanager')
var statusBoardCollection = require('./statusboardcollection');
var siteFiles = require('./sitefiles');

/*
 Status board construcor
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

/*
 Validates whether the board id is formatted correctly
 @param {string} boardId - The id to validate
 */
StatusBoard.validateId = function(boardId)
{
    // TODO: validate id scheme for board
    return true;
}

/*
 Creates a new status board.
 @param {string} boardId - The object to check
 @param {object} postObj - POST data object containing the necessary fields to construct a status board
 @return {object/false} - The status board object OR false on error
 */
StatusBoard.createNew = function(boardId, postObj)
{
    if(StatusBoard.validateId(boardId))
    {
        var newBoard = new StatusBoard(boardId, postObj.d);
        statusBoardCollection[boardId] = newBoard;
        // update the file remapping and add a processor for this board path
        siteFiles.addRemappedFile('/' + boardId, config.settings.indexfile, config.extensionMap['.html'], true);
        return newBoard;
    }
    return false;
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
        // TODO: any need for allowing type to change?
        //targetObj.t = sourceObj.t;
        targetObj.v = sourceObj.v;
        this.incrementVersion();
        if(config.settings.debug)
        {
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
    return this.v.toString();
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

module.exports = StatusBoard;