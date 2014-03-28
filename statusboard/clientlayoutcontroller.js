/*
 ClientLayoutController constructor
 @param {object} statusContainer - The status container object that has the current status board data object
 */
function ClientLayoutController(statusContainer)
{
    this.statusContainer = statusContainer;
    this.controlMap = {};
    this.controlMap['text'] = this.addTextItem;
    this.controlMap['radio'] = this.addRadioItem;
    this.controlMap['checkbox'] = this.addCheckboxItem;
    this.controlMap['select'] = this.addSelectItem;

    var that = this;

    /*
     Definition of the types of inputs required when the user adds a new status board item
     */
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

    // TODO: consider just making complete separate objects out of these?
    // TODO: might be able to minimize the code duplication if the createItem returns the "value" object
    /*
     Definition for the types of status board items that can be added, the required controls from itemConfigControls
     to do so, and core functionality to perform the add of the item.
     */
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

/*
 Sets the communicator object
 @param {object} communicator - The communicator to associate
 */
ClientLayoutController.prototype.setCommunicator = function(communicator)
{
    this.communicator = communicator;
}

/*
 Creates the given element with attributes and appends the given object (if supplied)
 @param {string} elementType - The type of element to create
 @param {object} attr - (optional) The attributes to associate with the element
 @param {jquery object} $appendToObj - (optional) The object to append the element to
 @return {jquery object} - The new element
 */
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

/*
 Gets the function that handles changes to the radio element when adding an item.
 @param {object} layoutController - The layoutcontroller containing the item configuration
 @param {object} item - The item that would be selected from the radio controls
 */
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

/*
 Configures the entire layout of the status board (the variable elements)
 */
ClientLayoutController.prototype.setupLayout = function()
{
    var that = this;
    var $body = $(document.body);

    var $titleDiv = this.createElement('div', null, $body);
    $titleDiv.text('StatusBoard');

    var $boardSelect = this.createElement('div',
        {
            id:'boardSelect'
        },
        $body);

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
    $addConfigDiv.append('Value:');
    $addConfigDiv.append(this.itemConfigControls.$textBox);
    this.createElement('br', null,  $addConfigDiv);
    $addConfigDiv.append('Options:');
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

/*
 Processes all the status board items and repopulates the status board item layout accordingly
 */
ClientLayoutController.prototype.processUpdate = function()
{
    var that = this;
    var updateData = this.statusContainer.statusBoardData;
    var $statusItemList = $(document.createElement('ul'));
    $statusItemList.attr(
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
            deleteButton.click(function()
                {
                    that.communicator.deleteItem($(this).parent().attr('id'));
                });
            $divItem.append(deleteButton);
            listItem.append($divItem);
            $statusItemList.append(listItem);
        }
        else
        {

        }
    }

    var statusDiv = $('#statusdata');
    statusDiv.empty();
    statusDiv.append($statusItemList);
    // TODO: investigate all the options on sortable (also is $statusItemList the obj below?)
    $statusItemList.sortable(
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

/*
 Repopulates the board selection div based on the input board data
 @param {array} boards - Array of board objects from the server
 */
ClientLayoutController.prototype.resetBoards = function(boards)
{
    var $boardList = $('#boardSelect');
    $boardList.empty();
    var that = this;
    for(var idx = 0, len = boards.length; idx < len; idx++)
    {
        //var $a = this.createElement('a', { href: '/board/' + boards[idx]}, $boardList);
        //$a.text(boards[idx]);
        var board = boards[idx];
        var $boardButton = this.createElement(
            'input',
            {
                type:'button',
                value:board.i + '-' + board.d
            },
            $boardList);
        // TODO: could the id be stored on the control so the function isn't duplicated across all buttons?
        $boardButton.click(function() { that.communicator.setBoardId(board.i); });
    }
}

/*
 Adds a text status board item
 @param {object} item - The item definition object
 @param {jquery object} $divItem - The container to add the item to
 */
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
        that.communicator.updateItem(item.i, that.updateItemValue(item.i, this));
    });
    $divItem.append(textInput);
}

/*
 Adds a radio status board item
 @param {object} item - The item definition object
 @param {jquery object} $divItem - The container to add the item to
 */
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
            that.communicator.updateItem(item.i, that.updateItemValue(item.i, this));
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

/*
 Adds a checkbox status board item
 @param {object} item - The item definition object
 @param {jquery object} $divItem - The container to add the item to
 */
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
            that.communicator.updateItem(item.i, that.updateCheckboxItemValue(item.i, this));
        });
    if(item.v.t === item.v.o[1])
    {
        $checkBox.prop('checked', true);
    }
    $divItem.append($checkBox);
    $divItem.append('TODO');
}

/*
 Adds a select status board item
 @param {object} item - The item definition object
 @param {jquery object} $divItem - The container to add the item to
 */
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
            that.communicator.updateItem(item.i, that.updateItemValue(item.i, this));
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

/*
 Updates the item value based on the id
 @param {string} itemId - Id of the status board item
 @param {object} item - The element to pull the value of
 @return {object} - The updated status board item
 */
ClientLayoutController.prototype.updateItemValue = function(itemId, item)
{
    var obj = this.statusContainer.statusBoardData.smap[itemId];
    obj.v.t = item.value;
    return obj;
}

/*
 Updates the item value based on the id
 @param {string} itemId - Id of the status board item
 @param {object} checkbox - The checkbox to pull the checked value of
 @return {object} - The updated status board item
 */
ClientLayoutController.prototype.updateCheckboxItemValue = function(itemId, checkbox)
{
    var obj = this.statusContainer.statusBoardData.smap[itemId];
    obj.v.t = checkbox.checked ? obj.v.o[1] : obj.v.o[0];
    return obj;
}
