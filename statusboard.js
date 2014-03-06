var config = require('./config');
var util = require('./util');
var statusBoardCollection = require('./statusboardcollection');

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

module.exports = StatusBoard;