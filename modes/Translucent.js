var log = require('../parrotLogger');
   
exports.name = 'translucent';

exports.genResponse = function respo(request, entries) {
   
   if(request.ignore) {
      log.log("translucent Mode: ignored request received: " + request.id, 2);
      return null;
   }
   
   if(entries[request.id] != null) {
      
      if(entries[request.id].ignore) {
         log.log("translucent Mode: ignored request received: " + request.id, 2);
         return null;
      }
      
      
      log.log("translucent Mode: known request received: " + request.id, 2);
      return entries[request.id];
   }else {
      log.log("translucent Mode: unknown request received: " + request.id, 2);
      return null;
   }
};