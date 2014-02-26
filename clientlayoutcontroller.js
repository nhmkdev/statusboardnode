function ClientLayoutController(statusContainer)
{
    this.statusContainer = statusContainer;
    this.controlMap = {};
    this.controlMap['text'] = this.addTextItem;
    this.controlMap['radio'] = this.addRadioItem;
    this.controlMap['checkbox'] = this.addCheckboxItem;
    this.controlMap['select'] = this.addSelectItem;
}
// TODO: jquery vars should start with $

ClientLayoutController.prototype.setCommunicator = function(communicator)
{
    this.communicator = communicator;
}

// TODO: use validator.w3.org
// TODO: investigate <label> tag

ClientLayoutController.prototype.processUpdate = function()
{
    var that = this;
    var updateData = this.statusContainer.statusBoardData;
    var statusItemList = $(document.createElement('ul'));
    for(var idx = 0, len = updateData.s.length; idx < len; idx++)
    {
        var item = updateData.s[idx];
        var controlFunc = this.controlMap[item.t];
        if(typeof controlFunc !== 'undefined')
        {
            var listItem = $(document.createElement('li'));
            listItem.attr(
                {
                    className:'ui-state-default'
                });
            var $divItem = $(document.createElement('div'));
            $divItem.attr(
                {
                    id:item.i
                });
            controlFunc.apply(this, [item, $divItem]);
            var deleteButton = $(document.createElement('input'));
            deleteButton.attr(
                {
                    type:'button',
                    value:'-'
                });
            deleteButton.click(function() { that.communicator.deleteItem(item.i); });
            $divItem.append(deleteButton);
            listItem.append($divItem);
            statusItemList.append(listItem);
        }
        else
        {

        }
    }

    var statusDiv = $('#statusdata');
    statusDiv.empty();
    statusDiv.append(statusItemList);
    // TODO: investigate all the options on sortable
    $('#statusdatalist').sortable(
        {
            start: function(event, ui)
            {
                $(this).attr('data-previndex', ui.item.index());
            },
            update: function(event, ui)
            {
                var newIndex = ui.item.index();
                var oldIndex = $(this).attr('data-previndex');
                $(this).removeAttr('data-previndex');
                console.log("New position: " + newIndex + ', Old Position:' + oldIndex);
                // the first child is always a div with id matching the field
                console.log("Info: " + ui.item.children().first().attr('id'));
                if(newIndex != oldIndex)
                {
                    moveItem(ui.item.children().first().attr('id'), newIndex);
                }
            }
        }
    );
}

ClientLayoutController.prototype.addTextItem = function(item, $divItem)
{
    var that = this;
    var textInput = $(document.createElement('input'));
    textInput.attr(
        {
            type:'text',
            id:'input' + item.i,
            value:item.v.t
        });
    textInput.change(function ()
    {
        that.communicator.pushUpdate(that.getItemValue(item.i, this));
    });
    $divItem.append(textInput);
}

ClientLayoutController.prototype.addRadioItem = function(item, $divItem)
{
    var that = this;
    var $radioForm = $(document.createElement('form'));
    $radioForm.attr(
        {
            id:'form' + item.i
        });
    for(var idx = 0, len = item.v.o.length; idx < len; idx++)
    {
        var subItem = item.v.o[idx];
        var lineSplitOptions = getProperty(item.v['so'], true);

        var $radioBtn = $(document.createElement('input'));
        $radioBtn.attr(
            {
                type:'radio',
                name:'option' + item.i,
                value:subItem
            });
        $radioBtn.change(function()
        {
            that.communicator.pushUpdate(that.getItemValue(item.i, this));
        });
        if(subItem === item.v.t)
        {
            $radioBtn.prop('checked', true);
        }
        $radioForm.append($radioBtn);
        $radioForm.append(subItem);
        if(lineSplitOptions)
        {
            $radioForm.append('<br>');
        }
    }
    $divItem.append($radioForm);
}

ClientLayoutController.prototype.addCheckboxItem = function(item, $divItem)
{
    var that = this;
    var $checkBox = $(document.createElement('input'));
    $checkBox.attr(
        {
            type:'checkbox',
            id:'check' + item.i
        });
    $checkBox.change(function()
        {
            that.communicator.pushUpdate(that.getCheckboxItemValue(item.i, this));
        });
    if(item.v.t === '1')
    {
        $checkBox.prop('checked', true);
    }
    $divItem.append($checkBox);
    $divItem.append('TODO');
}

ClientLayoutController.prototype.addSelectItem = function(item, $divItem)
{
    var that = this;
    var $select = $(document.createElement('select'));
    $select.attr(
        {
            id:'select' + item.i
        });
    $select.change(function()
        {
            that.communicator.pushUpdate(that.getItemValue(item.i, this));
        });
    for(var idx = 0, len = item.v.o.length; idx < len; idx++)
    {
        var subItem = item.v.o[idx];
        var $option = $(document.createElement('option'));
        $option.attr(
            {
                value:subItem
            });
        if(subItem === item.v.t)
        {
            $option.prop('selected', true);
        }
        $option.text(subItem);
        $select.append($option)
    }
    $divItem.append($select);
}

ClientLayoutController.prototype.getItemValue = function(id, item)
{
    var obj = this.statusContainer.statusBoardData.smap[id];
    obj.v.t = item.value;
    return obj;
}

ClientLayoutController.prototype.getCheckboxItemValue = function(id, checkbox)
{
    var obj = this.statusContainer.statusBoardData.smap[id];
    obj.v.t = checkbox.checked ? '1' : '0';
    return obj;
}
