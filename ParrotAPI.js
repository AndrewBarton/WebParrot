// Copyright Andrew Barton andrewbbarton@gmail.com,  2012
// http://www.opensource.org/licenses/MIT, see LICENSE

var parrot = require('./WebParrot');
var log = parrot.logger;
exports.logger = log;
var express = require('express');

var app = parrot.app;

exports.app = app;

var apiPageUrl = "/api*";


app.get('/', function(req, res) {
  res.redirect('/admin'); 
});

//possible actions =
   //remove request
   //get request text
   //get response text
   //toggle entry ignore
   //toggle entry lock
   //change mode
   //get mode
   //check cache entry
   //refresh cache entry
   //set transcoder
   
app.post(apiPageUrl, function(req, res) {
      var contents = req.body;

      log.log('API post receieved: ' + contents.toString(), 3);
      if(contents.removeRequest) {
         for(var i = 0; i < contents.removeRequest.length; i++) {
            parrot.removeReq(contents.removeRequest[i]);
         }
         res.send(JSON.stringify(req.body));
      }
      
      if(contents.requestSource) {
         var entry = exports.getCachedRequest(contents.requestSource);
         
         var text = 'method: ' + entry.request.method + '\n';
         for(var p in entry.request.headers) {
            text += p + ':' + entry.request.headers[p] + '\n';
         }
         text += '\n' + entry.reqData;
         res.send(text);
      }
      
      if(contents.responseSource) {
         var body = '';
         exports.getCachedRequest(contents.responseSource).data.forEach(function(part) {
            body += part;
         });
         res.send(body);
      }
      
      if(contents.toggleIgnore) {
         for(var i = 0; i < contents.toggleIgnore.length; i++) {
            parrot.toggleIgnore(contents.toggleIgnore[i]);
         }
         res.send(JSON.stringify(req.body));
      }
      
      if(contents.toggleLock) {
         for(var i = 0; i < contents.toggleLock.length; i++) {
            parrot.toggleLock(contents.toggleLock[i]);
         }
         res.send(JSON.stringify(req.body));
      }
      if(contents.mode) {
         parrot.setMode(contents.mode);
         res.send();
      }
      if(contents.getMode) {
         res.send(parrot.getMode());
      }
      if(contents.cacheCheck) {
            parrot.cacheCheck(contents.cacheCheck, res, function(updated) {
               var sendMe = {id:req.body.cacheCheck,
                     time:new Date(),
                     updated:updated};
               res.send(JSON.stringify(sendMe));
               
            });
      }
      if(contents.cacheReplace) {
         parrot.cacheReplace(contents.cacheReplace, res);
      }
      
      if(contents.setTranscoder) {
         var transcodes = contents.setTranscoder;
         if(transcoder.url == 'DEFAULT') {
            parrot.setDefaultTranscoder(transcodes.name, transcodes.params);
         }else {
            parrot.setTranscode(transcodes.url, transcodes.name, transcodes.params);
         }
         res.send();
      }
      
      
});

exports.getCachedReqsuests = function () {
   return parrot.getReqs();
};

exports.getCachedRequest = function (ID) {
   return parrot.getReqs()[ID];
};

exports.getDefaultTranscoder = function () {
  return parrot.getDefaultTranscoder(); 
};

exports.getDefaultTranscoderParams = function () {
   return parrot.getDefaultTranscoderParams();
};

exports.getMode =  function () {
   return parrot.getMode();
};



require('./public/');
