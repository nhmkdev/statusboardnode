// Load the config and logger before everything else
var config = require('./config');
var logger = require('../pathserver/logger');
logger.setDebugMode(config.settings.debug);

var pathserver = require('../pathserver/pathserver');

var siteFiles = require('./sitefiles'); // just requiring this file adds the paths
var statusBoard = require('./statusboard_paths'); // just requiring this file adds the paths

// TODO: make path processors an object so adding items is clear from params, not just making on-the-fly objects

// / - load index.html with list of boards
// Start the server!
pathserver.start(config.settings.port);