var http = require('http');
var translucent = require('./TranslucentMode');
//var api = require('./ParrotAPI');
//

var fileSystem = require('fs');

//used by my parts
var gets = Object.create(null);
var whiteList = Object.create(null);


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
  var delay = false;
  if(!parrotResponse) {
	  
	  
     
     //make the request to send to the server
     var proxy_request = proxy.request(request.method, request.url, request.headers);
     //save the request to be used later
     gets[request.url] = { myRequest : request};
     //add the listener for the response from the server
     proxy_request.addListener('response', function (proxy_response) {
   	  console.log("response from server received");
          //add the listener for the data of the http response
          proxy_response.addListener('data', 
                function(chunk) {
         	      console.log("data from server received");
                   //save the response to be used later
                   gets[request.url].data = chunk;
                   //
                   if(delay) {
                  	 console.log("delay encountered... why?!")
                  	 response.end();
                   }
                }
          );
          
          proxy_response.addListener('end', 
                function() {
         	 	  if(gets[request.url].data) {
                    console.log("end from server received");
              	 	  response.write(gets[request.url].data);
                    response.end();
         	 	  }else {
         	 		 delay = true;
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
     
     if(parrotResponse.headers) {
        response.writeHead(parrotResponse.statusCode, parrotResponse.headers);
     }else {
        response.writeHead(parrotResponse.statusCode);
     }
     response.write(parrotResponse.body, 'binary');
     response.end();
     
  }
 
  
  
}).listen(8080);

console.log("running!");