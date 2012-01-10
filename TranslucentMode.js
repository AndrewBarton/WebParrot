 
   


exports.genResponse = function respo(request, gets) {
   response = Object.create(null);
   if(gets[request.url] != null) {
      response.body = gets[request.url].data;
      response.headers = gets[request.url].headers;
      response.statusCode = gets[ request.url].statusCode;
      console.log("translucent Mode: known request received: " + request.url);
      return response;
   }else {
      console.log("translucent Mode: unknown request received: " + request.url);
      return null;
   }
};
console.log("translucentMode Ready");