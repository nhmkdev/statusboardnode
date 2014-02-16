var config = require("./config");
var util = require("./util");
var server = require("./server");
var requestHandlers = require("./requestHandlers");

var handlers = {};
handlers['/'] = getHandlerConfig(requestHandlers.start);
handlers['/jqueryscript'] = getHandlerConfig(requestHandlers.jqueryscript);
handlers['/update'] = getHandlerConfig(requestHandlers.update);
handlers['/sendupdate'] = getHandlerConfig(requestHandlers.sendUpdate);

function getHandlerConfig(handler, postDataFormat)
{
    var handlerObj = {};
    handlerObj.handler = handler;
    handlerObj.postDataFormat = util.getProperty(postDataFormat, 'utf8');
    return handlerObj;
}

server.start(handlers, config.settings.port);