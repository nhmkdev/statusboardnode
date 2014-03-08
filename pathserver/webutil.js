var util = require('./util');

/*
 Responds to the client with a standard 200 value
 @param {object} response - Standard response object from http
 @param {object} data - The data object (TODO: does this have to be a string to use .write?)
 @param {string} contenttype - The type of content (see HTTP standards)
 */
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

/*
 Responds to the client with a standard 404 error
 @param {object} response - Standard response object from http
 */
exports.return404 = function(response)
{
    // TODO: expand upon this...
    response.writeHead(404,
        {
            "Content-Type": "text/plain"
        });
    response.write("404 Not Found\n");
    response.end();
}