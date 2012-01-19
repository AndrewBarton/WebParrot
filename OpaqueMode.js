var log = require('./parrotLogger');

exports.name = 'opaque';

exports.genResponse = function(request, ID, reqs) {
   response = Object.create(null);
   if(reqs[ID] != null) {
      
      if(reqs[ID].ignore) {
         log.log("opaque Mode: ignored request received: " + ID, 2);
         return null;
      }
      
      
      log.log("opaque Mode: known request received: " + ID, 2);
      response.body = reqs[ID].chunk;
      response.headers = reqs[ID].headers;
      response.statusCode = reqs[ID].statusCode;
   }else {
      log.log("opaque Mode: unknown request received: " + ID, 2);
      response.chunk = "";
      response.statusCode = 404;
      response.headers = null;
      
   }
   return response;
};