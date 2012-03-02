// Copyright Andrew Barton andrewbbarton@gmail.com,  2012
// http://www.opensource.org/licenses/MIT, see LICENSE


var http = require('http');
var express = require('express');
var crypto = require('crypto');
var log = require('./parrotLogger');
var urlMod = require('url');

var proxyPort = 9090;
var defaultTranscoder = 'traceurCompiler';
var defaultParameters = null;
var entries = Object.create(null);
var mode = require('./modes/Translucent');
var strip = false;


process.on('uncaughtException', function(err) {
   console.log('\nCaught exception: ');
   console.log(err.stack);
   console.log('\nStill running though');
});





parseArgs();

var app = express.createServer();
exports.app = app;
exports.proxyPort = proxyPort;
log.log('Proxy running on port: ' + proxyPort, 0);



/**
 * Called when a request is received from the client.
 * @param request
 * @param response
 */
function requestBegin(request, response, next) {
   log.log('request received: ' + request.url, 3);
   //I'M A HACK, REMOVE ME!!!
   //if a reuqest is proxied, then it has the whole http part infront
   //else it does not, this slices off the / so we don't end up with /http://blah
   request.url = request.url.slice(1);
   var currentEntry = { request : request,
         reqData: [],
         data: [],
         id : '',
         ignore : false,
         lock : false,
         hash: 0,
         newData:[],
         newHeaders:null,
         headers:null,
         statusCode:null,
         etag:null,
         expires:null,
         newCache:false,
         cacheChecked:false,
         transcodeName:defaultTranscoder,
         transcodeParams:defaultParameters,
         timeRetrieved:new Date(),
         timeChecked:new Date()
   };
   
   var mdSum = crypto.createHash('md5');
   
   if(strip) {
      delete currentEntry.request.headers['if-none-satch'];
      delete currentEntry.request.headers['if-modified-since'];
   }
   
   var parsedUrl = urlMod.parse('http://' + request.headers.host);
   //if the request is addressed to our server, and is not the demo with a query string attached.
   if(parsedUrl.port == proxyPort) {
      
      if( !(entries[request.url+'0'] && entries[request.url+'0'].isSourceMap) && (request.url.indexOf('demo', request.url.length - 'demo'.length) == -1 || request.headers.from == 'passed@through.com')) {
         log.log('passing request to API:' + request.url, 3);
         next();
         return;
      }else {
         
         request.headers.from = 'passed@through.com';
      }
      
   }
   
   //when the data part of the request is received, write out the data part of the 
   //request to the server
   addRequestDataListener(request, currentEntry, mdSum);
   
   //same as above except with the end of the request
   
   request.addListener('end', function() {
      
      //if request is not a get then we need to hash the contents to differentiate between requests with the same URL
      if(currentEntry.reqData.length > 0) {
         currentEntry.hash = mdSum.digest('hex');
      }
      currentEntry.id = currentEntry.request.url + currentEntry.hash;
      log.log('end from client received for: ' + currentEntry.id, 3);
      
      var parrotResponse = null;
      
      //returns null if in transparent mode or if unknown request in translucent mode.
      if(request.method != 'PUT') {
         parrotResponse = mode.genResponse(currentEntry, entries);
      }else {
         log.log('put recieved, bypassing parrot and refreshing cache for: ' + request.url, 1);
      }
      
      
      //if there is not a parrot response
      if(!parrotResponse) {
         noEntry(request, response, currentEntry);
      }else {
         sendParrotResponse(parrotResponse, response);
      }
      
      
   });

}








/**
 *  If the body of the response can be transcoded.
 *  In order to be transcoded it must not be a cache hit, must have at least 1 transcoder,
 *  must be of a content-type that contains javascript or text, and must not be gziped
 * @param entry
 * @returns {Boolean}
 */
function canTranscode(entry) {
   if(entry.statusCode && entry.statusCode != 304 && entry.statusCode < 400) {
      return (entry.transcodeName != ''
         && entry.headers
         && (!entry.headers['content-encoding'] || entry.headers['content-encoding'].search('gzip') == -1)
         && ( entry.headers['content-type'] && (entry.headers['content-type'].search('javascript') != -1
         || entry.headers['content-type'].search('text') != -1)));
   }else {
      return false;
   }
   
}











/**
 * Invoked when a request that has no entry is received.
 * 
 * @param request the request generated by node
 * @param response the response generated by node
 * @param currentEntry data on the current request
 */
function noEntry(request, response, currentEntry) {
   var options = urlMod.parse(request.url);
   options.headers = request.headers;
   var proxyRequest = http.request(options);
   //make the request to send to the server
   
   //save the request to be used later
   
   
   
   //add the listener for the response from the server
   proxyRequest.addListener('response', function(proxyResponse) {
      log.log('response from server received', 3);
      
      addProxyResponseDataListener(currentEntry, proxyResponse, response);
      addProxyResponseEndListener(currentEntry, proxyResponse, response);
     
      
      //if there is a record for this ID and it is not locked
      //lastly save the headers of the response for later
         if(entries[currentEntry.id]  && !entries[currentEntry.id].lock) {
         currentEntry.headers = proxyResponse.headers;
         currentEntry.statusCode = proxyResponse.statusCode;
      }
      
      
      //if we do not transcode this response then we want to send the headers now
      //so we can send the data piece by piece instead of buffering it for the end.
      if(!canTranscode(currentEntry)) {
         log.log('writing out head for response', 3);
         response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
      }
   
   });
   
   //if there is no record, or if there is a record and it is not locked
   if(!entries[currentEntry.id] || !entries[currentEntry.id].lock) {
      entries[currentEntry.id] = currentEntry;
   }
   
   currentEntry.reqData.forEach(function(data) {
      proxyRequest.write(data, 'binary');
   });
   
   proxyRequest.end();
   
   if(request.method == 'PUT') {
      putKnockout(request);
   }
}









/**
 * Adds the listener for the data from the origin server
 * 
 * @param currentEntry the entry of the current request
 * @param response the response generated by node
 */
function addProxyResponseDataListener(currentEntry, proxyResponse, response) {
   //add the listener for the data of the http response
   proxyResponse.addListener('data', function(chunk) {
   
      log.log('data from server received', 3);
      
      //if there is a record for this ID and it is not locked
      //add the chunk to the end of list of known response chunks
      if(entries[currentEntry.id]  && !entries[currentEntry.id].lock) {
         entries[currentEntry.id].data[entries[currentEntry.id].data.length] = chunk;
      }
      
      //if it is not to be transcoded, then we want to send it immediately since it may be a large file.
      //On the other hand if it is to be transcoded then we need the whole content for the transcoder
      if(!canTranscode(currentEntry)) {
         
         response.write(chunk, 'binary');
      }
   });
}











/**
 *  Adds the listener for the end of the response from the origin server
 * @param currentEntry my data on the current request
 * @param response the response generated by node
 */
function addProxyResponseEndListener(currentEntry, proxyResponse, response) {
   proxyResponse.addListener('end', function() {
      
      //if we can transcode it, do so, else we already sent the body along earlier.
      if(canTranscode(currentEntry)) {
         //need to give the transcoder the entire body at once
         body = transcode(currentEntry);
         currentEntry.headers['content-length'] = body.length;
         response.writeHead(currentEntry.statusCode, currentEntry.headers);
         response.write(body, 'binary');
      }
      
      if(entries[currentEntry.id].data.length > 0) {
         log.log('end from server received', 3);
         response.end();
      }else {
        log.log('end from server received without data, check cache', 3);
        response.end();
      }
   });
}











/**
 * Sends the cached response to the client.
 * 
 * @param parrotResponse my data on the current request
 * @param response the response generated by node
 */
function sendParrotResponse(parrotResponse, response) {
   if(!parrotResponse.statusCode) {
      parrotResponse.statusCode = 502;
      log.log('tried to parrot a response without a statusCode: ' + parrotResponse.request.url, 2);
   }
   if(parrotResponse.data) {
      //if the entry has a transcoder assigned and it is of a type that can be transcoded
      if(canTranscode(parrotResponse)) {
         //need to give the transcoder the entire body at once
         var body = transcode(parrotResponse);
         //if there was a problem during transcoding
         if(typeof body != 'undefined') {
            parrotResponse.headers['content-length'] = body.length;
            response.writeHead(parrotResponse.statusCode, parrotResponse.headers);
            response.write(body, 'binary');
         }else {
            parrotResponse.headers['content-length'] = 0;
            response.writeHeader('500', parrotResponse.headers);
         }
         
      }else {
         response.writeHead(parrotResponse.statusCode, parrotResponse.headers);
         //no transcoding for this response
         parrotResponse.data.forEach(function(data) {
            response.write(data, 'binary');
         });
         
      }
   }
   response.end();
}











/**
 * Adds the listener for data from the client
 * 
 * @param request the request generated by node
 * @param currentEntry my data on the request
 */
function addRequestDataListener(request, currentEntry, mdSum) {
      request.addListener('data', function(chunk) {
      log.log('data from client received', 3);
      
      //add the chunk to the end of the list of known request chunks
      currentEntry.reqData[currentEntry.reqData.length] = chunk;
      mdSum.update(chunk);
   });
}











/**
 * transcodes the given entry and returns the body
 * @param entry the entry to be transcoded
 * @returns {String} the body to be sent to the client.
 */
function transcode(entry) {
   var body = '';
   entry.data.forEach(function(data) {
      body += data.toString();
   });
   
   var transcoderNames = entry.transcodeName.split(/[-,]/);
   transcoderNames.forEach(function(name) {
      var transcoder = require('./transcoders/' + name);
      //if the transcoder exists, since they are loaded at call time.
      //useless since it'll crash at a bad require.
      if(transcoder) {
         body = transcoder.transcode(body, entry.transcodeParams, entry);
         
      }else {
         log.log('Tried to transcode a response with a bad transcoder name: ' + name, 1);
      }
   });
   return body;
}













/**
 * Refreshes the cache for any PUTs sent through the proxy
 * @param request
 */
function putKnockout(request) {
   if(!entries[request.url + '0']) {
      return;
   }else {
      var entry = entries[request.url + '0'];
   }
   var options = urlMod.parse(request.url);
   options.headers = request.headers;
   
   
   var proxyRequest = http.request(options);
   //add the listener for the response from the server
   proxyRequest.addListener('response', function(proxyResponse) {
         entry.newCache = false;
         entry.headers = proxyResponse.headers;
         entry.data = [];
         entry.timeRetrieved = new Date();
         entry.timeChecked = new Date();
         
         //add the listener for the data of the http response
         proxyResponse.addListener('data', function(chunk) {
            entry.data[entry.newData.length] = chunk;
            
         });
     
   });
   proxyRequest.end();
}










/**
 * Checks the cache against the content served by the origin server.
 * 
 * @param request The request(ID) sent to us by the client
 * @param response The response generated by node
 * @param callback a function to call with the result (true or false)
 * @param force whether to force a cache replace or not
 */
exports.cacheCheck = function(request, response, callback, force) {
   log.log('Cache check for: ' + request, 1);
   force = (typeof force == 'undefined')? false:force;
   var entry = entries[request];
   
   var requestHeaders = entry.request.headers;
   if(entry.request.method.toLowerCase() != 'get') {
      return;
   }
   
   if(entry.headers.etag) {
      requestHeaders['If-None-Match'] = entry.headers.etag;
   }
   if(entry.headers.expires) {
      requestHeaders['If-Modified-Since'] = entry.headers.expires;
   }
   
   var options = urlMod.parse(entry.request.url);
   options.headers = entry.request.headers;
   var proxyRequest = http.request(options);
   var newData = [];
   //add the listener for the response from the server
   proxyRequest.addListener('response', function(proxyResponse) {
      entry.cacheCheck = true;
      log.log('cache check response from server received status: ' + proxyResponse.statusCode, 3);
      
         
         
         //add the listener for the data of the http response
         proxyResponse.addListener('data', function(chunk) {
            newData[newData.length] = chunk;
         });
         proxyResponse.addListener('end', function() {
            var equal = newData.length == entry.data.length;
            for(var i = 0; i < newData.length && equal; i++) {
               equal &= newData[i] == entry.data[i];
            }
            if(proxyResponse.statusCode !='304' || force || !equal) {
               entry.newCache = true;
               entry.newHeaders = proxyResponse.headers;
               entry.newData = newData;
               entry.timeChecked = new Date();
            }else {
               request.newCache = false;
               callback(false);
            }
            
            
            callback(true);
         });
     
   });
   proxyRequest.end();
};











/**
 * Replaces the parrot's cache with the data from the origin server.
 * @param request The request(an ID) from the client.
 * @param response The response generated by node
 */
exports.cacheReplace = function(request, response) {
   log.log('replace cache for: ' + entries[request].id, 1);
   //if we do not know that there is a new page
   exports.cacheCheck(request, response, function(updated) {
      //if there was a new page, set it in and respond to the client to update itself.
      var sendMe = {id:entries[request].id, updated:true, time:new Date()};
      
      if(updated) {
         var entry = entries[request];
         entry.headers = entry.newHeaders;
         entry.newHeaders = null;
         entry.data = entry.newData;
         entry.newData = [];
         entry.newCache = false;
         entry.cacheCheck = false;
         entry.timeRetrieved = new Date();
         entry.timeChecked = new Date();
        
      }else {
         sendMe.updated = false;
         entry.timeChecked = new Date();
      }
         response.send(JSON.stringify(sendMe));
      
      
   }, true);
};

/**
 * Removes a request from the entries list
 * @param request The request ID sent to us by the client.
 */
exports.removeReq = function(request) {
   delete entries[request];
   log.log('remove: ' + request, 1);
};






/**
 * 
 * @returns the list of entries
 */
exports.getReqs = function() {
   return entries;
};





/**
 * Toggles the lock on an entry
 * @param request The requestID sent to us by the client
 */
exports.toggleLock = function(request) {
   entries[request].lock = !entries[request].lock;
   log.log('lock: ' + entries[request].lock + ' on: ' + request, 1);
};







/**
 * Toggles the ignore on an entry
 * @param request The requestID sent to us by the client
 */
exports.toggleIgnore = function(request) {
   
   entries[request].ignore = !entries[request].ignore;
   log.log('ignore: ' + entries[request].ignore + ' on: ' + request, 1);
};






/**
 * 
 * @returns The current mode's name
 */
exports.getMode = function() {
   return mode.name;
};






/**
 *  Sets the mode to the given mode by file name
 * @param newMode
 */
exports.setMode = function(newMode) {
  mode = require('./modes/' + newMode);
  log.log('mode set to: ' + newMode, 1);
};






/**
 * Sets the transcoder for an entry
 * @param url
 * @param name
 * @param params
 */
exports.setTranscode = function(ID, name, params) {
   log.log('setting transcoder: ' + ID + ', ' + name, 1);
  if(entries[ID]) {
     entries[ID].transcodeName = name;
     entries[ID].transcodeParams = params;
  }else {
     log.log('tried to set transcode for unknown url: ' + ID, 1);
  }
};




/**
 * 
 * @returns {String} The default transcoders
 */
exports.getDefaultTranscoder = function() {
   return defaultTranscoder;
};





/**
 * 
 * @returns The default transcoder parameters.
 */
exports.getDefaultTranscoderParams = function() {
   return defaultParameters;
};


/**
 * Every module needs to use the same logger in order to use the same logging level.
 */
exports.logger = log;


/**
 * Parses arguments and sets the values accordingly.
 */
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
         mode = require('./modes/' + args[i]);
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
      if(args[i].toLowerCase() == '-defaulttranscoder') {
         i++;
         if(args[i]) {
            log.log('Default transcoders set to: ' + args[i], 1);
            defaultTranscoder = args[i];
         }
      }
      if(args[i].toLowerCase() == '-defaultparameters') {
         i++;
         if(args[i]) {
            defaultParameters = parseParameters(args[i]);
         }
      }
      if(args[i] == '-h' || args[i] == '?') {
         var fs = require('fs');
         
         console.log(fs.readFileSync('./cmdHelp', 'utf-8'));
         process.exit(0);
      }
      if(args[i] == '-strip') {
         strip = true;
      }
   }
}

/**
 * 
 * @param paras The string containing the command line formatted parameters
 * @returns An object containing the default parameters
 */
function parseParameters(paras) {
   var parts = paras.split('-');
   var json = '{';
   parts.forEach(function(part) {
      var subParts = part.split(':');
      json += '"' + subParts[0] + '":"' + subParts[1] + '",';
   });
   json = json.substring(0, json.length-1);
   json += '}';
   return JSON.parse(json);
}



//need to use the body parser
app.use(express.bodyParser());
//all requests need to be handled by requestBegin.
app.all('*', requestBegin);
//start up the API
var api = require('./ParrotAPI');
//and start the server
app.listen(proxyPort);
