/*
  This is a client side only file that handles all communication to the statusboard server.
  // TODO: future dev, potentially support multiple status boards at once?
 */

/*
 ClientCommunicator constructor
 @param {object} statusContainer - The status container object that has the current status board data object
 */
function ClientCommunicator(statusContainer)
{
    // TODO: private vars or who cares...?
    this.statusContainer = statusContainer;
    this.layoutController = null;
    this.updateRequester = null;
    this.updatePending = false;
    this.boardId = null;
}

/*
 Sets the layout controller to use for ui updates based on data from the server
 @param {object} layoutController - The layout controller to use
 */
ClientCommunicator.prototype.setLayoutController = function(layoutController)
{
    this.layoutController = layoutController;
}

/*
 Sets the id of the statusboard to associate with and initiates the update process with the given board id.
 @param {string} boardId - The board id to associate with
 */
ClientCommunicator.prototype.setBoardId = function(boardId)
{
    this.boardId = boardId;
    this.requestUpdate(true);
}

/*
 Gets The url of the board
 @return {string} - url of the current assigned board, or null if no board is associated
 */
ClientCommunicator.prototype.getBoardUrl = function()
{
    // TODO: this needs to pull 'board' from config!
    return (this.boardId == null) ? null : (window.location.origin + '/board/' + this.boardId);
}

/*
 Gets The url of the board
 @return {string} - url of the current assigned board, or null if no board is associated
 */
ClientCommunicator.prototype.getBoardItemUrl = function(itemId)
{
    var boardUrl = this.getBoardUrl();
    return (boardUrl == null) ? null : (this.getBoardUrl() + '/' + itemId);
}

/*
 Requests an update from the server if required. The data version of the status data is checked before requesting
 the entire data set. // TODO: plenty of other options on how to approach this instead of polling (long response etc...)

 Once initiated will continuously request a data version check every 5 seconds (can be interrupted to fire immediately)
 */
ClientCommunicator.prototype.requestUpdate = function(forceUpdate)
{
    if(this.updatePending)
    {
        return;
    }

    this.updatePending = true;
    if(this.updateRequester != null)
    {
        clearTimeout(this.updateRequester);
    }

    if(!forceUpdate)
    {
        var that = this;
        this.ajaxGETRequest(
            {action:'getdataversion'},
            this.getBoardUrl(),
            function(response, code, xhr)
            {
                that. updatePending = false;
                if(that.statusContainer.statusBoardData.v != response)
                {
                    // mismatched version, request full update
                    console.log('data version mismatch forcing update');
                    that.requestUpdate(true);
                }
                else
                {
                    console.log('data is up to date waiting...');
                    that.updateRequester = setTimeout(function() { that.requestUpdate(); }, 5000);
                }
            }
        );
    }
    else
    {
        var that = this;
        this.ajaxGETRequest(
            null,
            this.getBoardUrl(),
            function(response, code, xhr)
            {
                // TODO: this is a HAAAAACK and requires a bit more thought
                that.updatePending = false;
                try
                {
                    console.log('x:' + response);
                    // TODO: rethink the storage of this on the client (how and where) -- add function to statuscontainer to deal with code below?
                    that.statusContainer.statusBoardData = JSON.parse(response);
                    that.statusContainer.statusBoardData.smap = createArrayToObjectMap(that.statusContainer.statusBoardData.s, 'i');
                    that.layoutController.processUpdate();
                }
                catch (e)
                {
                    console.error("Parsing error:", e);
                }
                that.updateRequester = setTimeout(function() { that.requestUpdate(); }, 5000);
            }
        );
    }
}

/*
 Updates a given item on the server side
 @param {string} itemId - The id of the item to update
 @param {object} updateData - The update data to pass to the server
 */
ClientCommunicator.prototype.updateItem = function(itemId, updateData)
{
    var that = this;
    this.ajaxPOSTRequest({action:'updateitem', d:updateData},
        this.getBoardItemUrl(itemId),
        function(response, code, xhr)
        {
            // TODO...
            that.requestUpdate(true);
        }
    );
}

/*
 Adds the given item to the status board on the server
 @param {string} type - The type of the item
 @param {string} description - The description of the item
 @param {object} value - The value to assign to the item
 */
ClientCommunicator.prototype.addItem = function(type, description, value)
{
    // TODO: hard coded text creation...
    var that = this;
    this.ajaxPOSTRequest(
        {action:'additem', t:type, d:description, v:value},
        this.getBoardItemUrl('+'), // on item add the item id is whatever
        function(response, code, xhr)
        {
            // TODO:...
            that.requestUpdate(true);
        }
    );
}

/*
 Deletes the given item from the status board on the server
 @param {string} itemId - The id of the item to delete
 */
ClientCommunicator.prototype.deleteItem = function(itemId)
{
    var that = this;
    this.ajaxDELETERequest(
        null,
        this.getBoardItemUrl(itemId),
        function(response, code, xhr)
        {
            // TODO...
            that.requestUpdate(true);
        }
    );
}

/*
 Moves the specified item to the given index
 @param {string} itemId - The id of the item to move
 @param {number} destination - The destination index to move the item to
 */
ClientCommunicator.prototype.moveItem = function(itemId, destination)
{
    var that = this;
    this.ajaxPOSTRequest({action:'moveitem', i:itemId, d:destination},
        function(response, code, xhr)
        {
            // TODO...
            that.requestUpdate(true);
        }
    );
}

/*
 Gets a list of board ids from the server (and passes it to the layout controller)
 */
ClientCommunicator.prototype.getBoardList = function()
{
    // TODO: TEMP while re-evaluating RESTness
    // TODO '/boards' needs to come from config
    var that = this;
    this.ajaxGETRequest(
        null,
        window.location.origin + '/boards',
        function(response, code, xhr)
        {
            console.log(response);
            that.layoutController.resetBoards(JSON.parse(response));
        });
}

// TODO: reduce these functions if possible

/*
 Makes an AJAX request to DELETE based on the input params
 @param {object} data - The data to pass
 @param {string} url - The url to pass the request to
 @param {function} success - The function to call on success (see AJAX success documentation)
 */
ClientCommunicator.prototype.ajaxDELETERequest = function(data, url, success)
{
    console.log('DELETE: ' + (data == null ? 'null' : JSON.stringify(data)) + ' TO: ' + url);
    $.ajax(
        {
            cache : false,
            // setup the server address
            type: 'DELETE',
            processData: true,
            url : url,
            data: data,
            success : success
        }
    );
}

/*
 Makes an AJAX request to GET based on the input params
 @param {object} data - The data to pass
 @param {string} url - The url to pass the request to
 @param {function} success - The function to call on success (see AJAX success documentation)
 */
ClientCommunicator.prototype.ajaxGETRequest = function(data, url, success)
{
    console.log('GET: ' + (data == null ? 'null' : JSON.stringify(data)) + ' TO: ' + url);
    $.ajax(
        {
            cache : false,
            // setup the server address
            type: 'GET',
            processData: true,
            url : url,
            data: data,
            success : success
        }
    );
}

/*
 Makes an AJAX request to POST based on the input params
 @param {object} data - The data to pass (automatically converted to a JSON string)
 @param {string} url - The url to pass the request to
 @param {function} success - The function to call on success (see AJAX success documentation)
 */
ClientCommunicator.prototype.ajaxPOSTRequest = function(data, url, success)
{
    console.log('POST: ' + JSON.stringify(data) + ' TO: ' + url);
    $.ajax(
        {
            cache : false,
            // setup the server address
            type: 'POST',
            processData: false,
            url : url,
            data: JSON.stringify(data),
            success : success
        }
    );
}
