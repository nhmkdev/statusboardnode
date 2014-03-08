var debugMode = false;

/*
 Sets the debug mode flag for the logger
 @param {bool} enabled - bool indicating whether debug mode should be enabled
 */
exports.setDebugMode = function(enabled)
{
    debugMode = enabled;
    exports.log('DEBUG MODE SET: ' + debugMode);
}

/*
 Gets whether debug mode is enabled
 @return {bool} true if debug mode is enabled, false otherwise
 */
exports.getDebugMode = function()
{
    return debugMode;
}

/*
 Logs the given message to the console
 @param {string} msg - The message to display
 */
exports.log = function log(msg)
{
    console.log(msg);
}

/*
 Logs the given message to the console if debug mode is enabled
 @param {string} msg - The message to display
 */
exports.logDebug = function (msg)
{
    if(debugMode)
    {
        exports.log(msg);
    }
}