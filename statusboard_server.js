var config = require("./config");
var siteFiles = require("./sitefiles");
var server = require("./server");
var requestRouters = require("./requestRouters");
var statusBoard = require("./statusboard");
//var requestHandlers = require("./requesthandlers");

// Configure routers
var routers = {};
requestRouters.addRouter(routers, 'POST', false, requestRouters.postrouter);
requestRouters.addRouter(routers, 'GET', true, requestRouters.getrouter);
requestRouters.addRouter(routers, 'DELETE', true, requestRouters.deleterouter);

var pathProcessors = {};
statusBoard.addPathProcessor(pathProcessors);
siteFiles.addPathProcessor(pathProcessors);

// TODO: make path processors an object so adding items is clear from params, not just making on-the-fly objects

// TODO: additional on-the-fly added path processors so users can bookmark a specific board
// / - load index.html with list of boards
// /board/[boardid] - load index.html with board preset
// move current /board/[boardid] -> /board_data/

// Start the server!
server.start(routers, pathProcessors, config.settings.port);