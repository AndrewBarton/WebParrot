// Copyright Andrew Barton andrewbbarton@gmail.com,  2012
// http://www.opensource.org/licenses/MIT, see LICENSE


var http = require('http');
var translucent = require('./TranslucentMode');
var transparent = require('./TransparentMode');
var opaque = require('./OpaqueMode');

var crypto = require('crypto');
var log = require('./parrotLogger');



var proxyPort = 8080;
exports.webPort = 8081;
exports.demoPort = 0;
var reqs = Object.create(null);
var whiteList = [];
var mode = translucent;


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
         if(args[i].toLowerCase() == 'transparent'){
            mode = transparent;
         }else if(args[i].toLowerCase() == 'opaque') {
            mode = opaque;
         }else {
            mode = translucent;
         }
      }
      if(args[i] == '-w') {
         i++;
         if(args[i]) {
            exports.webPort = args[i];
         }
      }
      if(args[i] == '-p') {
         i++;
         if(args[i]) {
            proxyPort = args[i];
         }
      }
      if(args[i] == '-d') {
         i++;
         if(args[i]) {
            exports.demoPort = args[i];
         }
      }
      if(args[i] == '-h') {
         var fs = require('fs');
         
         console.log(fs.readFileSync('./cmdHelp', 'utf-8'));
         process.exit(0);
      }
   }
}




parseArgs();
var api = require('./ParrotAPI');
http.createServer(requestBegin).listen(proxyPort);
log.log('Proxy running on port: ' + proxyPort, 0);



/**
 * Called when a request is received from the client.
 * @param request
 * @param response
 */
function requestBegin(request, response) {
   log.log('request received', 3);
   var currentRequest = { myRequest : request,
         reqData: [],
         data: [],
         ignore : false,
         lock : false,
         hash: 0};
   var currentRequestID = '';
   var mdSum = crypto.createHash('md5');
   
 //when the data part of the request is received, write out the data part of the 
   //request to the server
   request.addListener('data', function(chunk) {
      log.log('data from client received', 3);
      
      //add the chunk to the end of the list of known request chunks
      currentRequest.reqData[currentRequest.reqData.length] = chunk;
      mdSum.update(chunk);
   });
   
   //same as above except with the end of the request
   request.addListener('end', function() {
      
      //if request is not a get then we need to hash the contents to differentiate between requests with the same URL
      if(currentRequest.reqData.length > 0) {
         currentRequest.hash = mdSum.digest('hex');
      }
      currentRequestID = currentRequest.myRequest.url + currentRequest.hash;
      log.log('end from client received for: ' + currentRequestID, 3);
      
      var portToUse = 80;
      if(request.headers.host.indexOf(':') != -1) {
         portToUse = request.headers.host.slice(request.headers.host.indexOf(':')+1);
      }
      if(portToUse == exports.webPort) {
         noParrot(request, response, currentRequest, portToUse);
         return;
      }

      //returns null if in transparent mode or if unknown request in translucent mode.
      var parrotResponse = mode.genResponse(currentRequest, currentRequestID, reqs);
      
      
      
      //if there is not a parrot response
      if(!parrotResponse) {
         var pathToUse = request.url.slice(7);
         pathToUse = pathToUse.slice(pathToUse.search('/'));
         
         var options = {headers:request.headers,
                        hostname:request.headers.host.replace(new RegExp(':.*'), ''),
                        port:portToUse,
                        path:pathToUse
                        };
         var proxyRequest = http.request(options);
         //make the request to send to the server
         
         //save the request to be used later
         
         
         
         //add the listener for the response from the server
         proxyRequest.addListener('response', function(proxyResponse) {
            log.log('response from server received', 3);
            
            //add the listener for the data of the http response
            proxyResponse.addListener('data', function(chunk) {
               
               log.log('data from server received', 3);
               
               //if there is a record for this ID and it is not locked
               //add the chunk to the end of list of known response chunks
               if(reqs[currentRequestID]  && !reqs[currentRequestID].lock) {
                  reqs[currentRequestID].data[reqs[currentRequestID].data.length] = chunk;
               }
               response.write(chunk, 'binary');
            });
            
            
            
            proxyResponse.addListener('end', function() {
               if(reqs[currentRequestID].data.length > 0) {
                  log.log('end from server received', 3);
                  response.end();
              }else {
                 log.log('end from server received without data, check cache', 3);
                 response.end();
              }
            });
            
            //if there is a record for this ID and it is not locked
            //lastly save the headers of the response for later
            if(reqs[currentRequestID]  && !reqs[currentRequestID].lock) {
               reqs[currentRequestID].headers = proxyResponse.headers;
               reqs[currentRequestID].statusCode = proxyResponse.statusCode;
            }
            
            
            //and write out the headers
            log.log('writing out head for response', 3);
            response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
         });
            
         //if there is no record, or if there is a record and it is not locked
         if(!reqs[currentRequestID] || !reqs[currentRequestID].lock) {
            //if the url is on the white list
            //if(checkWhiteList(currentRequest.myRequest.url)) {
               reqs[currentRequestID] = currentRequest;
            //}
         }
         for(var j = 0; j < currentRequest.reqData.length; j++) {
            proxyRequest.write(currentRequest.reqData[j], 'binary');
         }
         proxyRequest.end();
         
         
      }else {
         response.writeHead(parrotResponse.statusCode, parrotResponse.headers);
         if(parrotResponse.body) {
            for(var j = 0; j < parrotResponse.body.length; j++) {
               response.write(parrotResponse.body[j], 'binary');
            }
         }
         
         response.end();
      }
      
      
   });

}

function noParrot(request, response, currentRequest, portToUse) {
   log.log('Request received on web port: ' + request.headers.host, 2);
   var pathToUse = request.url.slice(7);
   pathToUse = pathToUse.slice(pathToUse.search('/'));
   
   var options = {headers:request.headers,
                  hostname:request.headers.host.replace(new RegExp(':.*'), ''),
                  port:8081,
                  path:pathToUse,
                  method:request.method
                  };
   
 //make the request to send to the server
   var proxyRequest = http.request(options);
   if(currentRequest.reqData) {
      for(var i = 0; i < currentRequest.reqData.length; i++) {
         proxyRequest.write(currentRequest.reqData[i]);
      }
   }
   
   
   
   //add the listener for the response from the server
   proxyRequest.addListener('response', function(proxyResponse) {
      log.log('response from server received: ', 3);
      
      //add the listener for the data of the http response
      proxyResponse.addListener('data', function(chunk) {
         
         log.log('data from server received', 3);
         response.write(chunk, 'binary');
      });
      
      
      
      proxyResponse.addListener('end', function() {
           response.end();
      });
      response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
   });
   proxyRequest.end();
}

exports.removeReq = function(request) {
   delete reqs[request];
   log.log('remove: ' + request, 1);
};

exports.getReqs = function() {
   return reqs;
};

exports.toggleLock = function(request) {
   reqs[request].lock = !reqs[request].lock;
   log.log('lock: ' + reqs[request].lock + ' on: ' + request, 1);
};

exports.toggleIgnore = function(request) {
   
   reqs[request].ignore = !reqs[request].ignore;
   log.log('ignore: ' + reqs[request].ignore + ' on: ' + request, 1);
};

exports.getMode = function() {
   console.log('current mode is: ' + mode.name);
   return mode.name;
};

exports.setMode = function(newMode) {
   console.log('new mode is:' + newMode);
  if(newMode.toLowerCase() == 'translucent') {
     mode = translucent;
  }
  if(newMode.toLowerCase() == 'transparent') {
     mode = transparent;
  }
  if(newMode.toLowerCase() == 'opaque') {
     mode = opaque;
  }
};

