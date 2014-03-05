exports.settings =
{
	port:8888, // server port
    jqueryscript:'/jquery-2.1.0.min.js', // relative path to the jquery script you want to use
    jqueryuiscript:'/jquery-ui-1.10.4.min.js',
    jqueryuicss:'/jquery-ui-1.10.4.min.css',
    utilscript:'/util.js',
    clientcommunicatorscript:'/clientcommunicator.js',
    clientlayoutcontrollerscript:'/clientlayoutcontroller.js',
    validFiles:{},
    remappedFiles:{},
    postProcessFileFuncs: {},
    // TODO: eventually break this into modes based on type of client (web vs. mobile vs. whatever)
    indexfile:'/index.html', // relative path to index.html file
    debug:true // flag for whether the log various things to the console
};

// board / boards and any other constants should come from config

var extensionMap = {};
extensionMap['.js'] = { type: 'text/javascript', encoding:'utf8' };
extensionMap['.css'] = { type: 'text/css', encoding:'utf8' };
extensionMap['.png'] = { type: 'image/png', encoding: null };
extensionMap['.jpg'] = { type: 'image/jpeg', encoding:null };
extensionMap['.gif'] = { type: 'image/gif', encoding:null };
extensionMap['.html'] = { type: 'text/html', encoding:'utf8' };

function log(msg)
{
    console.log(msg);
}

function logDebug(msg)
{
    if(exports.settings.debug)
    {
        log(msg);
    }
}

exports.extensionMap = extensionMap;
exports.log = log;
exports.logDebug = logDebug;