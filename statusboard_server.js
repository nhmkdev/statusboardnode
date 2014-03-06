var config = require("./config");
var server = require("./server");
var siteFiles = require("./sitefiles"); // just requiring this file adds the paths
var statusBoard = require("./statusboard"); // just requiring this file adds the paths

// TODO: make path processors an object so adding items is clear from params, not just making on-the-fly objects

// TODO: additional on-the-fly added path processors so users can bookmark a specific board
// / - load index.html with list of boards
// /board/[boardid] - load index.html with board preset
// move current /board/[boardid] -> /board_data/

// Start the server!
server.start(config.settings.port);