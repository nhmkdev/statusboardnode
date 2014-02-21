var util = require("./util");

function StatusBoard()
{
    this.v = 0; // version of data
    this.i = 0; // item counter
    this.s = []; // field set
    this.smap = {}; // mapping of the items by 'i' field into the set array
}

StatusBoard.prototype.incrementVersion = function()
{
    this.v++;
}

StatusBoard.prototype.getNextItemId = function()
{
    return 'i' + this.i++;
}

StatusBoard.prototype.addItem = function(fieldType, value)
{
    var newItem =
    {
        i:this.getNextItemId(),
        t:fieldType,
        v:value
    }
    this.s.push(newItem);
    this.smap[newItem.i] = newItem;
    this.incrementVersion();
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

StatusBoard.prototype.updateItems = function(updatedItems)
{
    // NOTE: this data is an array for no specific reason (client never sends more than one)
    for(var idx = 0, len = updatedItems.length; idx < len; idx++)
    {
        var sourceObj = updatedItems[idx];
        var targetObj = this.smap[sourceObj.i];
        if(typeof targetObj !== 'undefined')
        {
            console.log('Updated data for field: ' + sourceObj.i);
            targetObj.t = sourceObj.t;
            targetObj.v = sourceObj.v;
            this.incrementVersion();
        }
        else
        {
            console.log('Failed to map update data: ' + sourceObj.i);
        }
    }
}

StatusBoard.prototype.getBoardAsJSON = function()
{
    return JSON.stringify(this, dataReplacer);
}

function dataReplacer(key, value)
{
    if (key === "smap")
    {
        return undefined;
    }
    return value;
}

module.exports = StatusBoard;