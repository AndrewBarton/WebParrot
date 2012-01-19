var log = require('./parrotLogger');
   
exports.name = 'translucent';

exports.genResponse = function respo(request, ID, reqs) {
   response = Object.create(null);
   
   if(request.ignore) {
      log.log("translucent Mode: ignored request received: " + ID, 2);
      return null;
   }
   
   if(reqs[ID] != null) {
      
      if(reqs[ID].ignore) {
         log.log("translucent Mode: ignored request received: " + ID, 2);
         return null;
      }
      
      response.body = reqs[ID].data;
      response.headers = reqs[ID].headers;
      response.statusCode = reqs[ID].statusCode;
      log.log("translucent Mode: known request received: " + ID, 2);
      return response;
   }else {
      log.log("translucent Mode: unknown request received: " + ID, 2);
      return null;
   }
};