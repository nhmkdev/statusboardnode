var config = require("./config");
var util = require("./util");
var server = require("./server");
var requestRouters = require("./requestRouters");
var requestHandlers = require("./requesthandlers");

var routers = {};
routers['POST'] =
{
    hasQueryString:false,
    func:requestRouters.postrouter
};
routers['GET'] =
{
    hasQueryString:true,
    func:requestRouters.getrouter
}

var handlers = {};
addHandlerConfig('/', requestHandlers.root, true); // handler for loading a given status board
// request handlers (action param of the url)
// TODO: consider putting these into another object ?)
addHandlerConfig('sendupdate', requestHandlers.sendUpdate, true);
addHandlerConfig('pushitemupdate', requestHandlers.pushItemUpdate, true);
addHandlerConfig('getdataversion', requestHandlers.getDataVersion, true);
addHandlerConfig('addboard', requestHandlers.addBoard, false);
addHandlerConfig('additem', requestHandlers.addItem, true);
addHandlerConfig('deleteitem', requestHandlers.deleteItem, true);

function addHandlerConfig(action, handlerFunc, requireValidBoardId, postDataFormat)
{
    var handlerObj = {};
    handlerObj.func = handlerFunc;
    if(config.settings.debug)
    {
        handlerObj.func = function(urlData, statusBoardCollection, response, postdata)
        {
            // TODO: central debug log call?
            console.log('[DEBUG] HANDLER Called: ' + action);
            handlerFunc(urlData, statusBoardCollection, response, postdata)
        };
    }
    handlerObj.requireValidBoardId = util.getProperty(requireValidBoardId, false);
    handlerObj.postDataFormat = util.getProperty(postDataFormat, 'utf8');
    handlers[action] = handlerObj;
}

server.start(routers, handlers, config.settings.port);