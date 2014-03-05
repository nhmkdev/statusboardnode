var util = require("./util");

exports.respondWithContents = function(response, data, contenttype)
{
    // TODO: make this method accept an object with properties instead of params (so return404 could just use it)
    contenttype = util.getProperty(contenttype, 'text/plain');
    response.writeHead(200, {"Content-Type": contenttype});
    if(typeof data !== 'undefined')
    {
        response.write(data);
    }
    response.end();
}

exports.return404 = function(response)
{
    response.writeHead(404,
        {
            "Content-Type": "text/plain"
        });
    response.write("404 Not Found\n");
    response.end();
}