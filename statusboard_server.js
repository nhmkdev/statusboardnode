var config = require("./config");
var server = require("./server");
var requestRouters = require("./requestRouters");
var requestHandlers = require("./requesthandlers");

// Configure routers
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

// Configure handlers
var handlers = {};
requestHandlers.addHandlerConfig(handlers, '/', requestHandlers.root, true); // handler for loading a given status board
// request handlers (action param of the url)
// TODO: consider putting these into another object ?)
// TODO: add in the fields that must be specified with each as a validation step when calling the handler
requestHandlers.addHandlerConfig(handlers, 'sendupdate', requestHandlers.sendUpdate, true);
requestHandlers.addHandlerConfig(handlers, 'pushitemupdate', requestHandlers.pushItemUpdate, true);
requestHandlers.addHandlerConfig(handlers, 'getdataversion', requestHandlers.getDataVersion, true);
requestHandlers.addHandlerConfig(handlers, 'addboard', requestHandlers.addBoard, false);
requestHandlers.addHandlerConfig(handlers, 'additem', requestHandlers.addItem, true);
requestHandlers.addHandlerConfig(handlers, 'deleteitem', requestHandlers.deleteItem, true);
requestHandlers.addHandlerConfig(handlers, 'moveitem', requestHandlers.moveItem, true);

// Start the server!
server.start(routers, handlers, config.settings.port);