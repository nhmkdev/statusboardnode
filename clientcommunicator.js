function ClientCommunicator(statusContainer)
{
    this.statusContainer = statusContainer;
    console.log('x:' + typeof statusContainer === 'undefined');
    this.updateRequester = null;
    this.updatePending = false;
}

ClientCommunicator.prototype.setLayoutController = function(layoutController)
{
    this.layoutController = layoutController;
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
        this.ajaxGETRequest({action:'getdataversion'},
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
        this.ajaxGETRequest({action:'sendupdate'},
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

ClientCommunicator.prototype.pushUpdate = function(updateData)
{
    // TODO: maintain a client side copy of the status board object to simplify this...
    var obj = {};
    obj.s =
        [
            updateData
        ];

    var that = this;
    this.ajaxPOSTRequest({ action:'pushitemupdate', data:obj},
        function(response, code, xhr)
        {
            // TODO...
            that.sendUpdate(true);
        }
    );
}

ClientCommunicator.prototype.addItem = function(type)
{
    // TODO: hard coded text creation...
    var that = this;
    this.ajaxPOSTRequest({action:'additem', t:type, v: { t:'new item' }},
        function(response, code, xhr)
        {
            // TODO...
            that.sendUpdate(true);
        }
    );
}

ClientCommunicator.prototype.deleteItem = function(id)
{
    // TODO: hard coded text creation...
    var that = this;
    this.ajaxPOSTRequest({action:'deleteitem', i:id},
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

ClientCommunicator.prototype.ajaxGETRequest = function(data, success)
{
    $.ajax(
        {
            cache : false,
            // setup the server address
            type: 'GET',
            processData: true,
            url : window.location,
            data: data,
            success : success
        }
    );
}

ClientCommunicator.prototype.ajaxPOSTRequest = function(data, success)
{
    $.ajax(
        {
            cache : false,
            // setup the server address
            type: 'POST',
            processData: false,
            url : window.location,
            data: JSON.stringify(data),
            success : success
        }
    );
}