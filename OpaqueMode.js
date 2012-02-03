var log = require('./parrotLogger');

exports.name = 'opaque';

exports.genResponse = function(request, ID, entries) {
   response = Object.create(null);
   if(entries[ID] != null) {
      
      if(entries[ID].ignore) {
         log.log("opaque Mode: ignored request received: " + ID, 2);
         return null;
      }
      
      
      log.log("opaque Mode: known request received: " + ID, 2);
      response = entries[ID];
   }else {
      log.log("opaque Mode: unknown request received: " + ID, 2);
      response.chunk = "";
      response.statusCode = 404;
      response.headers = null;
      
   }
   return response;
};