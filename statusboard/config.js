// TODO: files could be string or object allowing remapping of path (/file with source of /folder/file)
// todo: shared client config file? (client needs some of the paths like urlPathBoards)
exports.settings =
{
	port:8888, // server port
    jqueryscript:'/3rdparty/jquery/jquery-2.1.0.min.js', // relative path to the jquery script you want to use
    jqueryuiscript:'/3rdparty/jqueryui/jquery-ui-1.10.4.min.js',
    jqueryuicss:'/3rdparty/jqueryui/jquery-ui-1.10.4.min.css',
    utilscript:'/pathserver/util.js',
    clientcommunicatorscript:'/statusboard/clientcommunicator.js',
    clientlayoutcontrollerscript:'/statusboard/clientlayoutcontroller.js',
    indexfile:'/statusboard/index.html', // relative path to index.html file (TODO: maybe rename to statusboard.html)

    boardDataPath:'./boardfiles/', // path to load and save boards to/from
    urlPathBoards:'/boards/list', // access to the list of boards
    urlPathBoard:'/board', // access to a given board //board/{id}

    boardSaveInterval:30000, // how often to see if the boards need to be persisted to disc
    // TODO: eventually break this into modes based on type of client (web vs. mobile vs. whatever)
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

exports.extensionMap = extensionMap;