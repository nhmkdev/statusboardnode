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
addHandlerConfig('/', requestHandlers.root); // handler for loading a given status board
// request handlers (action param of the url)
addHandlerConfig('sendupdate', requestHandlers.sendUpdate);
addHandlerConfig('pushupdate', requestHandlers.pushUpdate);
addHandlerConfig('getdataversion', requestHandlers.getDataVersion);

function addHandlerConfig(path, handlerFunc, postDataFormat)
{
    var handlerObj = {};
    handlerObj.func = handlerFunc;
    handlerObj.postDataFormat = util.getProperty(postDataFormat, 'utf8');
    handlers[path] = handlerObj;
}

server.start(routers, handlers, config.settings.port);