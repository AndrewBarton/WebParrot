var log = require('../parrotLogger');

exports.name = 'opaque';

exports.genResponse = function(request, entries) {
   response = Object.create(null);
   if(entries[request.id] != null) {
      
      if(entries[request.id].ignore) {
         log.log("opaque Mode: ignored request received: " + request.id, 2);
         return null;
      }
      
      
      log.log("opaque Mode: known request received: " + request.id, 2);
      response = entries[request.id];
   }else {
      log.log("opaque Mode: unknown request received: " + request.id, 2);
      response.chunk = "";
      response.statusCode = 404;
      response.headers = null;
      
   }
   return response;
};