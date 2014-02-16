/*
 Checks if all the given properties exist on an object
 @param {object} obj - The object to check for properties
 @param {...} - All remaining params are strings to check the object for the existence of a corresponding property
 @return {bool} true on success, false otherwise
 */
exports.hasAllProperties = function(obj)
{
    if(typeof obj !== 'undefined' && obj != null)
    {
        for(var x = 1, len = arguments.length; x < len; x++)
        {
            if(!Util.defined(obj[arguments[x]]))
            {
                return false;
            }
        }
        return true;
    }
    return false;
}

/*
 Gets the value of an object
 @param {object} arg - The object to get
 @param {object} def - The default if the property is not found
 @return {object} The value of the property
 */
exports.getProperty = function(arg, def)
{
    return (typeof arg !== 'undefined') ? arg : def;
}

/*
 Gets whether the given object is defined
 @param {object} arg - The object to check
 @return {bool} true if the object is defined, false otherwise
 */
exports.defined = function(arg)
{
    return typeof arg !== 'undefined';
}

/*
 Checks if the parameter is a function
 @param {object} obj - The object to check
 @return {bool} True if the object is a function, false otherwise
 */
exports.isFunction = function(obj)
{
    return typeof obj === 'function';
}

/*
 Checks if the parameter is an array
 @param {object} arr - The object to check
 @return {bool} True if the object is an array, false otherwise
 */
exports.isArray = function(arr)
{
    return Object.prototype.toString.call(arr) === '[object Array]';
}

/*
 Creates an object from an array using the specified property as the key for mapping all the items from the array to the object
 @param (array) arr - Array to create the mapping from
 @param (string) prop - property to use as the key from each object in the array
 @param (object) obj - The object to map the items into (optional, will create a new object if necessary)
 @return (object) - The object with the mapped items, or null on error
 */
exports.createArrayToObjectMap = function(arr, prop, obj)
{
    if(!Util.defined(obj)) { obj = {}; }
    //TODO: more error checking?
    for(var x = 0, len = arr.length; x < len; x++)
    {
        obj[arr[x][prop]] = arr[x];
    }
    return obj;
}
