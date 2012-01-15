// Copyright Andrew Barton andrewbbarton@gmail.com,  2012
// http://www.opensource.org/licenses/MIT, see LICENSE


var http = require('http');
var translucent = require('./TranslucentMode');
var transparent = require('./TransparentMode');
var opaque = require('./OpaqueMode');

var crypto = require('crypto');
var log = require('./parrotLogger');
var mdSum = crypto.createHash('md5');


var proxyPort = 8080;
exports.webPort = 8081;
var reqs = Object.create(null);
var whiteList = [];
var mode = translucent.genResponse;


function parseArgs() {
   var args = process.argv;
   for(var i = 2; i < args.length; i++) {
      if(args[i] == '-v') {
         i++;
         if(args[i]) {
            log.logLevel = args[i];
         }
         
      }
      if(args[i] == '-m') {
         i++;
         if(args[i] == 'transparent'){
            mode = transparent.genResponse;
         }else if(args[i] == 'opaque') {
            mode = opaque.genResponse;
         }else {
            mode = translucent.genResponse;
         }
      }
      if(args[i] == '-w') {
         i++;
         if(args[i]) {
            this.webPort = args[i];
         }
      }
      if(args[i] == '-p') {
         i++;
         if(args[i]) {
            proxyPort = args[i];
         }
      }
      if(args[i] == '-h') {
         //\add help
      }
   }
}




parseArgs();

var api = require('./ParrotAPI');
//credit for the proxy part of the server to http://www.catonmat.net/http-proxy-in-nodejs/
http.createServer(requestBegin).listen(proxyPort);
log.log("Proxy running on port: " + proxyPort, 0);



/**
 * Called when a request is received from the client.
 * @param request
 * @param response
 */
function requestBegin(request, response) {
   log.log("request received", 3);
   var currentRequest = { myRequest : request,
         reqData: [],
         data: [],
         ignore : false,
         lock : false,
         hash: 0};
   var currentRequestID = '';
   
   
 //when the data part of the request is received, write out the data part of the 
   //request to the server
   request.addListener('data', function(chunk) {
      log.log("data from client received", 3);
      
      //add the chunk to the end of the list of known request chunks
      currentRequest.reqData[currentRequest.reqData.length] = chunk;
      mdSum.update(chunk);
      proxyRequest.write(chunk, 'binary');
   });
   
   //same as above except with the end of the request
   request.addListener('end', function() {
      log.log("end from client received for: " + currentRequestID, 3);
      //if request is not a get then we need to hash the contents to differentiate between requests with the same URL
      if(request.method != 'GET') {
         currentRequest.hash = mdSum.digest('hex');
      }
      currentRequestID = currentRequest.myRequest.url + currentRequest.hash;
      
      //returns null if in transparent mode or if unknown request in translucent mode.
      var parrotResponse = mode(currentRequest, currentRequestID, reqs);
      //if there is a parrot response or the site is not on the whitelist.
      if(!parrotResponse || !checkWhiteList(currentRequest.myRequest.url)) {
         
         var proxy = http.createClient(80, request.headers['host']);
         //make the request to send to the server
         var proxyRequest = proxy.request(request.method, request.url, request.headers);
         //save the request to be used later
         
         
         
         //add the listener for the response from the server
         proxyRequest.addListener('response', function(proxyResponse) {
            log.log("response from server received", 3);
            
            //add the listener for the data of the http response
            proxyResponse.addListener('data', function(chunk) {
               
               log.log("data from server received", 3);
               
               //if there is a record for this ID and it is not locked
               //add the chunk to the end of list of known response chunks
               if(reqs[currentRequestID]  && !reqs[currentRequestID].locked) {
                  reqs[currentRequestID].data[reqs[currentRequestID].data.length] = chunk;
               }
               response.write(chunk, 'binary');
            });
            
            
            
            proxyResponse.addListener('end', function() {
               if(reqs[currentRequestID].data.length > 0) {
                  log.log("end from server received", 3);
                  response.end();
              }else {
                 log.log("end from server received without data, check cache", 3);
                 response.end();
              }
            });
            
            //if there is a record for this ID and it is not locked
            //lastly save the headers of the response for later
            if(reqs[currentRequestID]  && !reqs[currentRequestID].locked) {
               reqs[currentRequestID].headers = proxyResponse.headers;
               reqs[currentRequestID].statusCode = proxyResponse.statusCode;
            }
            
            
            //and write out the headers
            log.log("writing out head for response", 3);
            response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
         });
            
         //if there is no record, or if there is a record and it is not locked
         if(!reqs[currentRequestID] || (reqs[currentRequestID] && !reqs[currentRequestID].locked)) {
            //if the url is on the white list
            //if(checkWhiteList(currentRequest.myRequest.url)) {
               reqs[currentRequestID] = currentRequest;
            //}
         }
         
         proxyRequest.end();
         
         
      }else {
         response.writeHead(parrotResponse.statusCode, parrotResponse.headers);
         for(var j = 0; j < parrotResponse.body.length; j++) {
            response.write(parrotResponse.body[j], 'binary');
         }
         response.end();
      }
      
      
   });

}



function checkWhiteList(url) {
   for(var i = 0; i < whiteList.length; i++) {
      if(url.test(whiteList[i])) {
         return true;
      }
   }
   return false;
}


exports.removeReq = function(request) {
   delete reqs[request];
   log.log("remove: " + request, 1);
};

exports.getReqs = function() {
   return reqs;
};

exports.toggleLock = function(request) {
   reqs[request].lock = !reqs[request].lock;
   log.log("lock: " + reqs[request].lock + " on: " + request, 1);
};

exports.toggleIgnore = function(request) {
   
   reqs[request].ignore = !reqs[request].ignore;
   log.log("ignore: " + reqs[request].ignore + " on: " + request, 1);
};

exports.getMode = function() {
   return mode;
};

exports.setMode = function(newMode) {
  if(newMode == 'translucent') {
     mode = translucent.genResponse;
  }
  if(newMode == 'transparent') {
     mode = transparent.genResponse;
  }
  if(newMode == 'opaque') {
     mode = opaque.genResponse;
  }
};

