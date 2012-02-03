// Copyright Andrew Barton andrewbbarton@gmail.com,  2012
// http://www.opensource.org/licenses/MIT, see LICENSE


var http = require('http');
var express = require('express');
var translucent = require('./TranslucentMode');
var transparent = require('./TransparentMode');
var opaque = require('./OpaqueMode');
var crypto = require('crypto');
var log = require('./parrotLogger');



var proxyPort = 9090;

var entries = Object.create(null);
var mode = translucent;
var strip = false;


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
         transcodeName:'testTranscoder',
         transcodeParams:null};
   var currentRequestID = '';
   var mdSum = crypto.createHash('md5');
   
   if(strip) {
      delete currentEntry.request.headers['if-none-satch'];
      delete currentEntry.request.headers['if-modified-since'];
   }
   var portToUse = getPort(request.headers.host);
   var pathToUse = getPath(request.url);
   if(portToUse == proxyPort) {
      if(!pathToUse.match('demo') || currentEntry.request.headers == 'passed@through.com') {
         
         next();
         return;
      }else {
         
         request.headers.from = 'passed@through.com';
      }
      
   }
   
 //when the data part of the request is received, write out the data part of the 
   //request to the server
   request.addListener('data', function(chunk) {
      log.log('data from client received', 3);
      
      //add the chunk to the end of the list of known request chunks
      currentEntry.reqData[currentEntry.reqData.length] = chunk;
      mdSum.update(chunk);
   });
   
   //same as above except with the end of the request
   request.addListener('end', function() {
      
      //if request is not a get then we need to hash the contents to differentiate between requests with the same URL
      if(currentEntry.reqData.length > 0) {
         currentEntry.hash = mdSum.digest('hex');
      }
      currentRequestID = currentEntry.request.url + currentEntry.hash;
      log.log('end from client received for: ' + currentRequestID, 3);
      
      

      //returns null if in transparent mode or if unknown request in translucent mode.
      var parrotResponse = mode.genResponse(currentEntry, currentRequestID, entries);
      
      
      
      //if there is not a parrot response
      if(!parrotResponse) {
         
         
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
               if(entries[currentRequestID]  && !entries[currentRequestID].lock) {
                  entries[currentRequestID].data[entries[currentRequestID].data.length] = chunk;
               }
               response.write(chunk, 'binary');
            });
            
            
            
            proxyResponse.addListener('end', function() {
               if(entries[currentRequestID].data.length > 0) {
                  log.log('end from server received', 3);
                  response.end();
              }else {
                 log.log('end from server received without data, check cache', 3);
                 response.end();
              }
            });
            
            //if there is a record for this ID and it is not locked
            //lastly save the headers of the response for later
            if(entries[currentRequestID]  && !entries[currentRequestID].lock) {
               entries[currentRequestID].headers = proxyResponse.headers;
               entries[currentRequestID].statusCode = proxyResponse.statusCode;
            }
            
            
            //and write out the headers
            log.log('writing out head for response', 3);
            response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
         });
            
         //if there is no record, or if there is a record and it is not locked
         if(!entries[currentRequestID] || !entries[currentRequestID].lock) {
            currentEntry.id = currentRequestID;
            entries[currentRequestID] = currentEntry;
         }
         for(var j = 0; j < currentEntry.reqData.length; j++) {
            proxyRequest.write(currentEntry.reqData[j], 'binary');
         }
         proxyRequest.end();
         
         
      }else {
         if(!parrotResponse.statusCode) {
            parrotResponse.statusCode = 502;
            log.log('tried to parrot a response without a statusCode: ' + parrotResponse.request.url, 2);
         }
         
         
         
         
         if(parrotResponse.data) {
            //if the entry has a transcoder assigned and it is of a type that can be transcoded
            if(parrotResponse.transcodeName != null
                  && (parrotResponse.headers['content-type'] == 'application/javascript'
                  || parrotResponse.headers['content-type'].search('text') != -1)) {
               console.log('starting transcode');
               //need to give the transcoder the entire body at once
               var body = '';
               for(var i = 0; i < parrotResponse.data.length; i++) {
                  body += parrotResponse.data[i].toString();
               }
               
               var transcoder = require('./transcoders/' + parrotResponse.transcodeName);
               
               //if the transcoder exists, since they are loaded at call time.
               if(transcoder) {
                  body = transcoder.transcode(body, parrotResponse.transcodeParams);
                  parrotResponse.headers['content-length'] = body.length;
                  response.writeHead(parrotResponse.statusCode, parrotResponse.headers);
                  response.write(body);
               }else {
                  log.log('Tried to transcode a response with a bad transcoder name: ' + parrotResponse.transcodeName, 1);
               }
               
            }else {
               response.writeHead(parrotResponse.statusCode, parrotResponse.headers);
               //no transcoding for this response
               for(var j = 0; j < parrotResponse.data.length; j++) {
                  response.write(parrotResponse.data[j], 'binary');
               }
               
            }
         }
         
         
         
        
         
         response.end();
      }
      
      
   });

}

exports.cacheCheck = function(request, response, callback, force) {
   log.log('Cache check for: ' + request, 1);
   force = (typeof force == 'undefined')? false:force;
   var entry = entries[request];
   var pathToUse = getPath(entry.request.url);
   var portToUse = getPort(entry.request.headers.host);
   var requestHeaders = entry.request.headers;
   if(entry.request.method.toLowerCase() != 'get') {
      return;
   }
   if(entry.headers.etag) {
      requestHeaders['If-None-Match'] = entry.headers.etag;
   }
   if(request.headers.expires) {
      requestHeaders['If-Modified-Since'] = entry.headers.expires;
   }
   var options = {headers:requestHeaders,
                  hostname:entry.request.headers.host.replace(new RegExp(':.*'), ''),
                  port:portToUse,
                  path:pathToUse
                  };
   var proxyRequest = http.request(options);
   
   //add the listener for the response from the server
   proxyRequest.addListener('response', function(proxyResponse) {
      entry.cacheCheck = true;
      log.log('cache check response from server received status: ' + proxyResponse.statusCode, 3);
      if(proxyResponse.statusCode !='304' || force) {
         entry.newCache = true;
         entry.newHeaders = proxyResponse.headers;
         entry.newData = [];
         
         //add the listener for the data of the http response
         proxyResponse.addListener('data', function(chunk) {
            entry.newData[entry.newData.length] = chunk;
         });
         proxyResponse.addListener('end', function() {
            callback(true);
         });
      }else {
         request.newCache = false;
         callback(false);
      }
     
   });
   proxyRequest.end();
};

exports.cacheReplace = function(request, response) {
   log.log('replace cache for: ' + entries[request].id, 1);
   //if we do not know that there is a new page
   if(!entries[request].cacheChecked) {
      /*
       * 
       */
      
      
      exports.cacheCheck(request, response, function(updated) {
         //if there was a new page, set it in and respond to the client to update itself.
         var sendMe = {cacheReplace:request.id, updated:true};
         if(updated) {
            request = entries[request];
            request.headers = request.newHeaders;
            request.newHeaders = null;
            request.data = request.newData;
            request.newData = [];
            request.newCache = false;
            request.cacheCheck = false;
            
         }else {
            sendMe.updated = false;
         }

         response.send(JSON.stringify(sendMe));
         
      }, true);
   }else {
      //we know that it has been checked if there is a new page
      request = entries[request];
      //if there is a new page
      if(request.newCache) {
         
         request.headers = request.newHeaders;
         request.newHeaders = null;
         request.data = request.newData;
         request.newData = [];
         request.newCache = false;
         request.cacheCheck = false;
         var sendMe = {cacheReplace:request.id};
         response.send(JSON.stringify(sendMe));
      }else {
         //no new page, no part of the client needs to know
         response.send('');
      }
     
   }
   
};
exports.removeReq = function(request) {
   delete entries[request];
   log.log('remove: ' + request, 1);
};

exports.getReqs = function() {
   return entries;
};

exports.toggleLock = function(request) {
   entries[request].lock = !entries[request].lock;
   log.log('lock: ' + entries[request].lock + ' on: ' + request, 1);
};

exports.toggleIgnore = function(request) {
   
   entries[request].ignore = !entries[request].ignore;
   log.log('ignore: ' + entries[request].ignore + ' on: ' + request, 1);
};

exports.getMode = function() {
   return mode.name;
};

exports.setMode = function(newMode) {
  if(newMode.toLowerCase() == 'translucent') {
     mode = translucent;
  }
  if(newMode.toLowerCase() == 'transparent') {
     mode = transparent;
  }
  if(newMode.toLowerCase() == 'opaque') {
     mode = opaque;
  }
  log.log('mode set to: ' + newMode, 1);
};

exports.setTranscode = function(url, name, params) {
  if(entries[url]) {
     entries[url].transcodeName = name;
     entries[url].transcodeparams = params;
  }else {
     log.log('tried to set transcode for unknown url: ' + url, 1);
  }
};

function getPath(url) {
   var pathToUse = url.slice(7);
   pathToUse = pathToUse.slice(pathToUse.search('/'));
   return pathToUse;
}

function getPort(host) {
   var portToUse = 80;
   if(host.indexOf(':') != -1) {
      portToUse = host.slice(host.indexOf(':')+1);
   }
   return portToUse;
}
app.use(express.bodyParser());
app.all('*', requestBegin);
var api = require('./ParrotAPI');
app.listen(proxyPort);
