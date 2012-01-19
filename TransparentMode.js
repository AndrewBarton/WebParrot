var log = require('./parrotLogger');

exports.name = 'transparent';

exports.genResponse = function(request, ID, reqs) {
   log.log("transparent Mode: request received: " + ID, 2);
   return null;
};