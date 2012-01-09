var http = require('http');

var app = require('express').createServer();

var fileSystem = require('fs');

//used by my parts
var gets = Object.create(null);
var whiteList = Object.create(null);


function getGets() {
	return gets;
}

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



var mode = TranslucentMode();
//credit for the proxy part of the server to http://www.catonmat.net/http-proxy-in-nodejs/
http.createServer(function(request, response) {
   
	
	
	
   //
   //if used as proxy
   //
  var proxy = http.createClient(80, request.headers['host']);
  //returns null if in transparent mode or if unknown get in translucent mode.
  var parrotResponse = mode.response(request, gets);
  if(parrotResponse == null) {
     
     //make the request to send to the server
     var proxy_request = proxy.request(request.method, request.url, request.headers);
     //save the request to be used later
     gets[request.headers.host + request.url] = { myRequest : request};
     //add the listener for the response from the server
     proxy_request.addListener('response', function (proxy_response) {
          //add the listener for the data of the http response
          proxy_response.addListener('data', 
                function(chunk) {
                //save the response to be used later
                gets[request.headers.host + request.url].data = chunk;
                  response.write(chunk, 'binary');
                }
          );
          
          proxy_response.addListener('end', 
                function() {
                  response.end();
                }
          );
          //lastly save the headers of the response for later
          gets[request.headers.host + request.url].headers = proxy_response.headers;
          //and write out the headers
          response.writeHead(proxy_response.statusCode, proxy_response.headers);
        });
        
        //when the data part of the request is received, write out the data part of the 
         //request to the server
        request.addListener('data', function(chunk) {
          proxy_request.write(chunk, 'binary');
        });
        //same as above except with the end of the request
        request.addListener('end', function() {
          proxy_request.end();
        });
  }else {
     response.write(parrotReponse.chunk, 'binary');
     if(parrotResponse.headers) {
        response.writeHead(parrotResponse.statusCode, parrotResponse.headers);
     }else {
        response.writeHead(parrotResponse.statusCode);
     }
     
     response.end();
     
  }
 
  
  
}).listen(8080);




//////////////////\\\\\\\\\\\\\\\\\
var proxyMode = { TRANSLUCENT : translucentMode(),
                  TRANSPARENT : transparentMode(),
                  OPAQUE : opaqueMode()};