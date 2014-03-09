// Load the config and logger before everything else
var config = require('./config');
var logger = require('../pathserver/logger');
logger.setDebugMode(config.settings.debug);

var pathserver = require('../pathserver/pathserver');

var siteFiles = require('./sitefiles'); // just requiring this file adds the paths
var statusBoard = require('./statusboard_paths'); // just requiring this file adds the paths

// Start the server!
pathserver.start(config.settings.port);