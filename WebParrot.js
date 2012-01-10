var http = require('http');
var translucent = require('./TranslucentMode');
//var api = require('./ParrotAPI');
//

var fileSystem = require('fs');

//used by my parts
var gets = Object.create(null);
var whiteList = Object.create(null);


///\\\changes to make... cached responses and whatnot need to be arrays so they can hold ajax stuffz. body parts need to also be arrays, so multi arrays

exports.getGets = function() {
   return gets;
};

function setGets(newGets) {
   gets = newGets;
}

function getWhiteList() {
   return whiteList;
}

function setWhiteList(newWhiteList) {
   whiteList = newWhiteList;
}

function getMode() {
   return mode;
}

function setMode(newMode) {
   mode = newMode;
}



var mode = translucent.genResponse;
//credit for the proxy part of the server to http://www.catonmat.net/http-proxy-in-nodejs/
http.createServer(function(request, response) {
   
   console.log("request received");
   
   
   //
   //if used as proxy
   //
  var proxy = http.createClient(80, request.headers['host']);
  //returns null if in transparent mode or if unknown get in translucent mode.
  var parrotResponse = mode(request, gets);
  
  if(!parrotResponse) {
     
     
     
     //make the request to send to the server
     var proxy_request = proxy.request(request.method, request.url, request.headers);
     //save the request to be used later
     gets[request.url] = { myRequest : request,
                             stillWriting: true};
     //add the listener for the response from the server
     proxy_request.addListener('response', function (proxy_response) {
        console.log("response from server received");
          //add the listener for the data of the http response
          proxy_response.addListener('data', 
                function(chunk) {
                  console.log("data from server received");
                   //save the response to be used later
                  if(gets[request.url].stillWriting) {
                      gets[request.url].data += chunk;
                  }else {
                     gets[request.url].data = chunk;
                  }
                  
                   response.write(chunk, 'binary');
                   
                   
                   
                }
          );
          
          proxy_response.addListener('end', 
                function() {
             
                      gets[request.url].stillWriting = false;
                     if(gets[request.url].data) {
                       console.log("end from server received");
                       //response.write(gets[request.url].data, 'binary');
                       response.end();
                     }else {
                       console.log("end from server received too early!");
                       response.end();
                     }
                  
                }
          );
          //lastly save the headers of the response for later
          gets[request.url].headers = proxy_response.headers;
          gets[request.url].statusCode = proxy_response.statusCode;
          //and write out the headers
          console.log("writing out head for response");
          response.writeHead(proxy_response.statusCode, proxy_response.headers);
        });
        
        //when the data part of the request is received, write out the data part of the 
         //request to the server
        request.addListener('data', function(chunk) {
           console.log("data from client received");
          proxy_request.write(chunk, 'binary');
        });
        //same as above except with the end of the request
        request.addListener('end', function() {
           console.log("end from client received");
          proxy_request.end();
        });
  }else {
     //console.log(parrotResponse);
     for(var i = 0; i < parrotResponse.length; i++) {
        response.writeHead(parrotResponse[i].statusCode, parrotResponse[i].headers);
        for(var j = 0; j < parrotResponse[i].body.length; j++) {
           response.write(parrotResponse[i].body[j], 'binary');
        }
        response.end();
     }
     
     
  }
 
  
  
}).listen(8080);

console.log("running!");