var http = require('http');
var translucent = require('./TranslucentMode');
//var api = require('./ParrotAPI');
var crypto = require('crypto');

var mdSum = crypto.createHash('md5');

var reqs = Object.create(null);
var whiteList = Object.create(null);
var mode = translucent.genResponse;

   

//credit for the proxy part of the server to http://www.catonmat.net/http-proxy-in-nodejs/
http.createServer(requestBegin).listen(8080);




/**
 * Called when a request is received from the client.
 * @param request
 * @param response
 */
function requestBegin(request, response) {
   console.log("request received");
   var proxy = http.createClient(80, request.headers['host']);
   //returns null if in transparent mode or if unknown get in translucent mode.
   var parrotResponse = mode(request, reqs);
  
   if(!parrotResponse) {
      
      //make the request to send to the server
      var proxyRequest = proxy.request(request.method, request.url, request.headers);
      //save the request to be used later
      var currentRequest = { myRequest : request,
                             reqData: [],
                             data: [],
                             ignore : false,
                             lock : false,
                             hash: 0};
      var currentRequestID = '';
      
      
      //add the listener for the response from the server
      proxyRequest.addListener('response', function(proxyResponse) {
         console.log("response from server received");
         
         //add the listener for the data of the http response
         proxyResponse.addListener('data', function(chunk) {
            console.log("data from server received");
            //add the chunk to the end of list of known response chunks
            reqs[currentRequestID].data[reqs[currentRequestID].data.length] = chunk;
            response.write(chunk, 'binary');
         });
         
         
         
         proxyResponse.addListener('end', function() {
            if(reqs[currentRequestID].data.length > 0) {
               console.log("end from server received");
               response.end();
           }else {
              console.log("end from server received too early!");
              response.end();
           }
         });
         
         //lastly save the headers of the response for later
         
         reqs[currentRequestID].headers = proxyResponse.headers;
         reqs[currentRequestID].statusCode = proxyResponse.statusCode;
         
         //and write out the headers
         console.log("writing out head for response");
         response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
      });
         
      
      
      //when the data part of the request is received, write out the data part of the 
      //request to the server
      request.addListener('data', function(chunk) {
         console.log("data from client received");
         
         //add the chunk to the end of the list of known request chunks
         currentRequest.reqData[currentRequest.reqData.length] = chunk;
         mdSum.update(chunk);
         proxyRequest.write(chunk, 'binary');
      });
      //same as above except with the end of the request
      request.addListener('end', function() {
         console.log("end from client received");
         if(request.method != 'GET') {
            currentRequest.hash = mdSum.digest('hex');
            currentRequestID = currentRequest.myRequest.url + currentRequest.hash;
         }else {
            currentRequestID = currentRequest.myRequest.url;
         }
         
         reqs[currentRequestID] = currentRequest;
         proxyRequest.end();
      });
   }else {
      //console.log(parrotResponse);
      response.writeHead(parrotResponse.statusCode, parrotResponse.headers);
      for(var j = 0; j < parrotResponse.body.length; j++) {
         response.write(parrotResponse.body[j], 'binary');
      }
      response.end();
   }
    

}

console.log("running!");


/*
exports.getreqs = function() {
   return reqs;
};

function setReqs(newReqs) {
   reqs = newReqs;
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
}*/