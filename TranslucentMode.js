var log = require('./parrotLogger');
   
exports.name = 'translucent';

exports.genResponse = function respo(request, ID, entries) {
   
   if(request.ignore) {
      log.log("translucent Mode: ignored request received: " + ID, 2);
      return null;
   }
   
   if(entries[ID] != null) {
      
      if(entries[ID].ignore) {
         log.log("translucent Mode: ignored request received: " + ID, 2);
         return null;
      }
      
      
      log.log("translucent Mode: known request received: " + ID, 2);
      return entries[ID];
   }else {
      log.log("translucent Mode: unknown request received: " + ID, 2);
      return null;
   }
};