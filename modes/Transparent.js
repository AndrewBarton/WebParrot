var log = require('../parrotLogger');

exports.name = 'transparent';

exports.genResponse = function(request, reqs) {
   log.log("transparent Mode: request received: " + request.id, 2);
   return null;
};