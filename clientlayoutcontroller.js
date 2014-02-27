function ClientLayoutController(statusContainer)
{
    this.statusContainer = statusContainer;
    this.controlMap = {};
    this.controlMap['text'] = this.addTextItem;
    this.controlMap['radio'] = this.addRadioItem;
    this.controlMap['checkbox'] = this.addCheckboxItem;
    this.controlMap['select'] = this.addSelectItem;

    this.itemConfigControls =
    {
        $descriptionBox:this.createElement('input',
            {
                type:'text'
            }),
        $textBox:this.createElement('input',
            {
                type:'text'
            }),
        $textArea:this.createElement('textarea',
            {
                rows:'4',
                cols:'50'
            })
    }

    var that = this;

    // TODO: consider just making complete separate objects out of these?
    // TODO: might be able to minimize the code duplication if the createItem returns the "value" object
    this.itemTypeConfig =
        [
            {
                text:'Text',
                type:'text',
                enabledControls:
                    [
                        that.itemConfigControls.$descriptionBox,
                        that.itemConfigControls.$textBox
                    ],
                createItem:function()
                {
                    that.communicator.addItem('text', that.itemConfigControls.$descriptionBox.val(), { t: that.itemConfigControls.$textBox.val() });
                }
            },
            {
                text:'Radio Button Set',
                type:'radio',
                enabledControls:
                    [
                        that.itemConfigControls.$descriptionBox,
                        that.itemConfigControls.$textArea
                    ],
                createItem:function()
                {
                    var options = that.itemConfigControls.$textArea.val().split('\n');
                    that.communicator.addItem('radio',
                        that.itemConfigControls.$descriptionBox.val(),
                        {
                            t: options[0],
                            o: options
                        });
                }
            },
            {
                text:'CheckBox',
                type:'checkbox',
                enabledControls:
                    [
                        that.itemConfigControls.$descriptionBox,
                        that.itemConfigControls.$textArea
                    ],
                createItem:function()
                {
                    var optionText = that.itemConfigControls.$textArea.val();
                    var options = optionText.split('\n');
                    if(options.length != 2)
                    {
                        // TODO: error to user?
                        options = ['False', 'True'];
                    }
                    that.communicator.addItem('checkbox',
                        that.itemConfigControls.$descriptionBox.val(),
                        {
                            t: options[0],
                            o: options
                        });
                }
            },
            {
                text:'Selector',
                type:'select',
                enabledControls:
                    [
                        that.itemConfigControls.$descriptionBox,
                        that.itemConfigControls.$textArea
                    ],
                createItem:function()
                {
                    var options = that.itemConfigControls.$textArea.val().split('\n');
                    that.communicator.addItem('select',
                        that.itemConfigControls.$descriptionBox.val(),
                        {
                            t: options[0],
                            o: options
                        });
                }
            }
        ];
    this.itemTypeConfigMap = createArrayToObjectMap(this.itemTypeConfig, 'type');

}
// TODO: jquery vars should start with $

ClientLayoutController.prototype.setCommunicator = function(communicator)
{
    this.communicator = communicator;
}

ClientLayoutController.prototype.createElement = function(elementType, attr, $appendToObj)
{
    var $element = $(document.createElement(elementType));
    if(getProperty(attr, null) != null)
    {
        $element.attr(attr);
    }
    if(getProperty($appendToObj, null) != null)
    {
        $appendToObj.append($element);
    }
    return $element;
}

function getRadioChangeFunc(layoutController, item)
{
    return function()
    {
        console.log('changed');
        // toggle all controls to disabled
        for(var itemName in layoutController.itemConfigControls)
        {
            if(layoutController.itemConfigControls.hasOwnProperty(itemName))
            {
                layoutController.itemConfigControls[itemName].prop('disabled', true);
            }
        }
        // toggle on the required controls
        for(var i = 0, controlsLen = item.enabledControls.length; i < controlsLen; i++)
        {
            item.enabledControls[i].prop("disabled", false);
        }
    };
}

ClientLayoutController.prototype.setupLayout = function()
{
    var that = this;
    var $body = $(document.body);

    var $titleDiv = this.createElement('div', null, $body);
    $titleDiv.text('StatusBoard');

    var $configDiv = this.createElement('div',
        {
            id:'config'
        },
        $body);

    var $addItemDiv = this.createElement('div',
        {
            id:'addItem'
        },
        $configDiv);

    var $addText = $(document.createElement('h3'));
    $addText.text('Add Item');
    $addItemDiv.append($addText);

    var $addConfigDiv = this.createElement('div', null, $addItemDiv);

    var $radioForm = this.createElement('form',
        {
            id:'newItemRadioForm'
        },
        $addConfigDiv);

    for(var idx = 0, len = this.itemTypeConfig.length; idx < len; idx++)
    {
        var subItem = this.itemTypeConfig[idx];
        var $radioBtn = this.createElement('input',
            {
                type:'radio',
                name:'newItemRadio',
                value:subItem.type
            },
            $radioForm);
        $radioBtn.change(getRadioChangeFunc(this, subItem));
        $radioForm.append(subItem.text);
    }

    $addConfigDiv.append('Description:');
    $addConfigDiv.append(this.itemConfigControls.$descriptionBox);
    this.createElement('br', null, $addConfigDiv);
    $addConfigDiv.append(this.itemConfigControls.$textBox);
    this.createElement('br', null,  $addConfigDiv);
    $addConfigDiv.append(this.itemConfigControls.$textArea);
    this.createElement('br', null,  $addConfigDiv);

    var $submitBtn = this.createElement('input',
        {
            type:'button',
            value:'Add Item'
        },
        $addConfigDiv);
    $submitBtn.click(function()
    {
        // TODO: error check a bit?
        var selectedType = $('input[name=newItemRadio]:checked', '#newItemRadioForm').val();
        var typeObj = that.itemTypeConfigMap[selectedType];
        typeObj.createItem();
    });

    $addItemDiv.accordion(
        {
            collapsible: true,
            active: false
        });

    $body.append($(document.createElement('hr')));

    // add the data div
    this.createElement('div',
        {
            id:'statusdata'
        },
        $body);

    $body.append($(document.createElement('hr')));
}

// TODO: use validator.w3.org
// TODO: investigate <label> tag

ClientLayoutController.prototype.processUpdate = function()
{
    var that = this;
    var updateData = this.statusContainer.statusBoardData;
    var statusItemList = $(document.createElement('ul'));
    statusItemList.attr(
        {
            id:'statusdatalist'
        });
    for(var idx = 0, len = updateData.s.length; idx < len; idx++)
    {
        var item = updateData.s[idx];
        var controlFunc = this.controlMap[item.t];
        if(typeof controlFunc !== 'undefined')
        {
            var listItem = $(document.createElement('li'));
            listItem.addClass('ui-state-default');
            var $divItem = $(document.createElement('div'));
            $divItem.attr(
                {
                    id:item.i
                });
            $divItem.append(item.d);
            controlFunc.apply(this, [item, $divItem]);
            var deleteButton = $(document.createElement('input'));
            deleteButton.attr(
                {
                    type:'button',
                    value:'-'
                },
                $divItem);
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
                    that.communicator.moveItem(ui.item.children().first().attr('id'), newIndex);
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
    if(item.v.t === item.v.o[1])
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
    obj.v.t = checkbox.checked ? obj.v.o[1] : obj.v.o[0];
    return obj;
}
