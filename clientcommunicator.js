function ClientCommunicator(statusContainer)
{
    this.statusContainer = statusContainer;
    console.log('x:' + typeof statusContainer === 'undefined');
    this.updateRequester = null;
    this.updatePending = false;
    this.boardId = '';
}

ClientCommunicator.prototype.setLayoutController = function(layoutController)
{
    this.layoutController = layoutController;
}

ClientCommunicator.prototype.setBoardId = function(boardId)
{
    this.boardId = boardId;
    this.sendUpdate(true);
}

ClientCommunicator.prototype.sendUpdate = function(forceUpdate)
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
                    that.sendUpdate(true);
                }
                else
                {
                    console.log('data is up to date waiting...');
                    that.updateRequester = setTimeout(function() { that.sendUpdate(); }, 5000);
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
                that.updateRequester = setTimeout(function() { that.sendUpdate(); }, 5000);
            }
        );
    }
}

ClientCommunicator.prototype.updateItem = function(itemId, updateData)
{
    var that = this;
    this.ajaxPOSTRequest({action:'updateitem', d:updateData},
        this.getBoardItemUrl(itemId),
        function(response, code, xhr)
        {
            // TODO...
            that.sendUpdate(true);
        }
    );
}

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
            that.sendUpdate(true);
        }
    );
}

ClientCommunicator.prototype.deleteItem = function(itemId)
{
    var that = this;
    this.ajaxDELETERequest(
        null,
        this.getBoardItemUrl(itemId),
        function(response, code, xhr)
        {
            // TODO...
            that.sendUpdate(true);
        }
    );
}

ClientCommunicator.prototype.moveItem = function(id, destination)
{
    var that = this;
    this.ajaxPOSTRequest({action:'moveitem', i:id, d:destination},
        function(response, code, xhr)
        {
            // TODO...
            that.sendUpdate(true);
        }
    );
}

ClientCommunicator.prototype.getBoardUrl = function()
{
    return window.location.origin + '/board/' + this.boardId;
}

ClientCommunicator.prototype.getBoardItemUrl = function(itemId)
{
    return this.getBoardUrl() + '/' + itemId;
}

ClientCommunicator.prototype.getBoardList = function()
{
    // TODO: TEMP while re-evaluating RESTness
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