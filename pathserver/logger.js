var debugMode = false;

exports.setDebugMode = function(enabled)
{
    debugMode = enabled;
    exports.log('DEBUG MODE SET: ' + debugMode);
}

exports.getDebugMode = function()
{
    return debugMode;
}

exports.log = function log(msg)
{
    console.log(msg);
}

exports.logDebug = function (msg)
{
    if(debugMode)
    {
        exports.log(msg);
    }
}